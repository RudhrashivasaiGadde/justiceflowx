"""
JusticeFlowX — Network Forensics Backend v4.0
Real API for Deep Packet Inspection & Threat Intelligence
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import json
import os
import time
import random
import threading
import urllib.request
import socket
import concurrent.futures
from datetime import datetime
from scapy.all import sniff, IP, TCP, UDP, ICMP, conf

app = Flask(__name__)
CORS(app)
import json

# ─────────────────────────────────────────
# THREAT INTEL
# ─────────────────────────────────────────
MALICIOUS_IPS = set()
THREAT_INTEL_CACHE = {}

def update_malicious_ips():
    global MALICIOUS_IPS
    try:
        req = urllib.request.Request("https://rules.emergingthreats.net/blockrules/compromised-ips.txt")
        with urllib.request.urlopen(req, timeout=10) as response:
            lines = response.read().decode('utf-8').splitlines()
            ips = {line.strip() for line in lines if line.strip() and not line.startswith('#')}
            MALICIOUS_IPS = ips
            print(f"Loaded {len(MALICIOUS_IPS)} malicious IPs from Emerging Threats.")
    except Exception as e:
        print(f"Failed to load malicious IPs: {e}")

threading.Thread(target=update_malicious_ips, daemon=True).start()

def get_ip_info(ip):
    if ip in ("127.0.0.1", "::1", "localhost") or ip.startswith("192.168.") or ip.startswith("10.") or ip.startswith("172."):
        return {"country": "Local Network", "as": "Private Network", "isp": "Local"}
    if ip in THREAT_INTEL_CACHE:
        return THREAT_INTEL_CACHE[ip]
    
    try:
        req = urllib.request.Request(f"http://ip-api.com/json/{ip}")
        with urllib.request.urlopen(req, timeout=2) as response:
            data = json.loads(response.read().decode('utf-8'))
            if data.get("status") == "success":
                info = {
                    "country": data.get("country", "Unknown"),
                    "as": data.get("as", "Unknown ASN"),
                    "isp": data.get("isp", "Unknown ISP")
                }
                THREAT_INTEL_CACHE[ip] = info
                return info
    except Exception:
        pass
    
    info = {"country": "Unknown", "as": "Unknown ASN", "isp": "Unknown ISP"}
    THREAT_INTEL_CACHE[ip] = info
    return info

def scan_single_port(ip, port):
    try:
        with socket.socket(socket.AF_INET, socket.socket.SOCK_STREAM) as s:
            s.settimeout(0.5)
            result = s.connect_ex((ip, port))
            return {"port": port, "state": "open" if result == 0 else "closed"}
    except:
        return {"port": port, "state": "closed"}

def scan_ports(ip):
    # Common ports to scan
    ports_to_scan = {21: "FTP", 22: "SSH", 80: "HTTP", 443: "HTTPS", 3389: "RDP"}
    results = []
    
    # Don't aggressively scan external networks to avoid getting blacklisted,
    # but do a very quick TCP connect for the sake of the dashboard.
    with concurrent.futures.ThreadPoolExecutor(max_workers=5) as executor:
        future_to_port = {executor.submit(scan_single_port, ip, port): port for port in ports_to_scan}
        for future in concurrent.futures.as_completed(future_to_port):
            port = future_to_port[future]
            res = future.result()
            results.append({
                "port": port,
                "service": ports_to_scan[port],
                "state": res["state"]
            })
            
    # Sort by port number
    results.sort(key=lambda x: x["port"])
    return results

# ─────────────────────────────────────────
# STATE
# ─────────────────────────────────────────
capture_thread = None
sniffing = False
packet_queue = []
packet_history = []
total_packets_captured = 0
active_filter = ""
capture_error = None

def process_packet(pkt):
    global packet_queue, packet_history, total_packets_captured
    total_packets_captured += 1
    
    # We only care about IP packets for the UI
    if IP in pkt:
        p_info = {
            "id": total_packets_captured,
            "src": pkt[IP].src,
            "dst": pkt[IP].dst,
            "len": len(pkt),
            "proto": "IP",
            "info": "",
            "payload_hex": ""
        }
        
        if TCP in pkt: 
            p_info["proto"] = "TCP"
            p_info["info"] = f"Src Port: {pkt[TCP].sport} -> Dst Port: {pkt[TCP].dport}"
            payload = bytes(pkt[TCP].payload)
        elif UDP in pkt: 
            p_info["proto"] = "UDP"
            p_info["info"] = f"Src Port: {pkt[UDP].sport} -> Dst Port: {pkt[UDP].dport}"
            payload = bytes(pkt[UDP].payload)
        elif ICMP in pkt: 
            p_info["proto"] = "ICMP"
            p_info["info"] = f"Type: {pkt[ICMP].type} Code: {pkt[ICMP].code}"
            payload = bytes(pkt[ICMP].payload)
        else:
            payload = bytes(pkt[IP].payload)
            
        # Format payload as hex for the UI (max 128 bytes to keep JSON small)
        if payload:
            hex_str = payload.hex()
            p_info["payload_hex"] = ' '.join(hex_str[i:i+2] for i in range(0, min(len(hex_str), 256), 2))
            
        packet_queue.append(p_info)
        packet_history.append(p_info)
        
        # Keep queue bounded to avoid memory leaks if UI stops polling
        if len(packet_queue) > 500:
            packet_queue = packet_queue[-500:]
            
        if len(packet_history) > 1000:
            packet_history = packet_history[-1000:]

def capture_loop():
    global capture_error
    capture_error = None
    try:
        print(f"Starting sniffing thread with filter: '{active_filter}'")
        kwargs = {"prn": process_packet, "stop_filter": lambda x: not sniffing, "store": 0}
        if active_filter:
            kwargs["filter"] = active_filter
        sniff(**kwargs)
        print("Sniffing thread stopped cleanly.")
    except Exception as e:
        capture_error = str(e)
        print(f"Exception in sniffing thread: {e}")

# ─────────────────────────────────────────
# ROUTES
# ─────────────────────────────────────────
@app.route("/", methods=["GET"])
def health():
    return jsonify({
        "status": "online",
        "version": "v4.0 Network Forensics",
        "time": datetime.utcnow().isoformat()
    })

@app.route("/api/start_capture", methods=["POST"])
def start_capture():
    global sniffing, capture_thread, packet_queue, total_packets_captured, active_filter, capture_error
    if sniffing:
        return jsonify({"status": "success", "message": "Already capturing"})
        
    data = request.get_json(silent=True) or {}
    active_filter = data.get("filter", "")
    
    sniffing = True
    packet_queue = []
    packet_history = []
    total_packets_captured = 0
    capture_error = None
    
    capture_thread = threading.Thread(target=capture_loop, daemon=True)
    capture_thread.start()
    
    return jsonify({
        "status": "success",
        "message": "Started real live capture",
        "pid": os.getpid()
    })

@app.route("/api/stop_capture", methods=["POST"])
def stop_capture():
    global sniffing
    sniffing = False
    return jsonify({
        "status": "success",
        "message": "Capture stopping",
        "packets_captured": total_packets_captured
    })

@app.route("/api/get_packets", methods=["GET"])
def get_packets():
    global packet_queue, capture_error
    # Return all packets currently in the queue, then clear it
    current_packets = packet_queue.copy()
    packet_queue.clear()
    
    status = "success"
    if capture_error:
        status = "error"
    
    return jsonify({
        "status": status,
        "error": capture_error,
        "packets": current_packets,
        "total": total_packets_captured
    })

@app.route("/api/packet_history", methods=["GET"])
def get_packet_history():
    global packet_history, total_packets_captured, capture_error
    status = "error" if capture_error else "success"
    return jsonify({
        "status": status,
        "error": capture_error,
        "packets": list(packet_history),
        "total": total_packets_captured
    })

@app.route("/api/status", methods=["GET"])
def get_status():
    global sniffing, total_packets_captured
    return jsonify({
        "sniffing": sniffing,
        "total": total_packets_captured
    })

@app.route("/api/threat_intel", methods=["POST"])
def threat_intel():
    data = request.get_json(force=True)
    ip_addr = data.get("ip", "127.0.0.1")
    
    is_malicious = ip_addr in MALICIOUS_IPS
    info = get_ip_info(ip_addr)
    scanned_ports = scan_ports(ip_addr)
    
    return jsonify({
        "ip": ip_addr,
        "malicious": is_malicious,
        "score": 100 if is_malicious else 0,
        "location": info["country"],
        "asn": info["as"],
        "notes": "Known Compromised IP" if is_malicious else ("Private Network" if "Local" in info["country"] else "Clean"),
        "ports": scanned_ports
    })

if __name__ == "__main__":
    print("JusticeFlowX Network Forensics Backend v4.0 running...")
    # debug=False is recommended with background threads to avoid Flask auto-reload threading issues
    app.run(host="0.0.0.0", port=8675, debug=False)