import pyshark
import logging

logger = logging.getLogger(__name__)

def parse_pcap(filepath: str, max_packets: int = 1000) -> dict:
    """
    Parses a PCAP file and extracts metadata:
    total packet count, unique source IPs, unique destination IPs, protocols, and anomalies.
    """
    cap = pyshark.FileCapture(filepath, keep_packets=False)
    
    total_packets = 0
    src_ips = set()
    dst_ips = set()
    protocols = set()
    anomalies = []

    try:
        for packet in cap:
            if total_packets >= max_packets:
                break
                
            total_packets += 1
            
            # Extract IPs
            if hasattr(packet, 'ip'):
                src_ips.add(packet.ip.src)
                dst_ips.add(packet.ip.dst)
            elif hasattr(packet, 'ipv6'):
                src_ips.add(packet.ipv6.src)
                dst_ips.add(packet.ipv6.dst)
                
            # Extract protocol
            if hasattr(packet, 'transport_layer'):
                protocols.add(packet.transport_layer)
                
                # Check for port anomalies (e.g., HTTP not on 80, 8080 or 443)
                if hasattr(packet, 'tcp'):
                    src_port = int(packet.tcp.srcport)
                    dst_port = int(packet.tcp.dstport)
                    
                    if hasattr(packet, 'http') and dst_port not in (80, 8080, 443):
                        anomalies.append(f"HTTP traffic on unusual port: {dst_port}")
                
            if hasattr(packet, 'dns'):
                protocols.add('DNS')

    except Exception as e:
        logger.error(f"Error parsing pcap at packet {total_packets}: {e}")
        # Return what we have so far
    finally:
        cap.close()

    return {
        "total_packets_parsed": total_packets,
        "unique_source_ips": list(src_ips),
        "unique_destination_ips": list(dst_ips),
        "protocols_detected": list(protocols),
        "anomalies": anomalies
    }
