import os
import asyncio
# pyrefly: ignore [missing-import]
import httpx
import logging
from sqlalchemy.orm import Session
import models
from database import SessionLocal

logger = logging.getLogger(__name__)

ABUSEIPDB_API_KEY = os.getenv("ABUSEIPDB_API_KEY")
THREAT_INTEL_MOCK_MODE = os.getenv("THREAT_INTEL_MOCK_MODE", "false").lower() == "true"

async def check_ip_reputation(ip: str, db: Session) -> dict:
    # 1. Check Cache
    cached_ip = db.query(models.IPReputationCache).filter(models.IPReputationCache.ip_address == ip).first()
    if cached_ip:
        return {
            "ip": ip,
            "score": cached_ip.abuse_confidence_score,
            "is_malicious": cached_ip.is_malicious
        }

    # 2. Check external API
    if not ABUSEIPDB_API_KEY:
        if THREAT_INTEL_MOCK_MODE:
            logger.info("Mock mode enabled. Returning dummy threat data.")
            is_malicious = ip.endswith(".99") # Simple dummy logic
            score = 90 if is_malicious else 0
            new_cache_entry = models.IPReputationCache(
                ip_address=ip, abuse_confidence_score=score, is_malicious=is_malicious
            )
            db.add(new_cache_entry)
            db.commit()
            return {"ip": ip, "score": score, "is_malicious": is_malicious}
        
        logger.warning("ABUSEIPDB_API_KEY not set and mock mode disabled. Cannot check IP.")
        return {"ip": ip, "score": 0, "is_malicious": False}

    url = "https://api.abuseipdb.com/api/v2/check"
    querystring = {
        'ipAddress': ip,
        'maxAgeInDays': '90'
    }
    headers = {
        'Accept': 'application/json',
        'Key': ABUSEIPDB_API_KEY
    }

    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(url, headers=headers, params=querystring)
            response.raise_for_status()
            data = response.json()
            
            score = data.get("data", {}).get("abuseConfidenceScore", 0)
            is_malicious = score > 50

            # 3. Save to cache
            new_cache_entry = models.IPReputationCache(
                ip_address=ip,
                abuse_confidence_score=score,
                is_malicious=is_malicious
            )
            db.add(new_cache_entry)
            db.commit()

            return {
                "ip": ip,
                "score": score,
                "is_malicious": is_malicious
            }
    except Exception as e:
        logger.error(f"Error checking IP {ip}: {e}")
        return {"ip": ip, "score": 0, "is_malicious": False}

async def process_pcap_ips(case_id: int, ips: list[str]):
    """Background task to process IPs and update the NetworkForensic record."""
    if not ips:
        return

    # Use a new DB session for the background task
    db = SessionLocal()
    if not db:
        return

    try:
        malicious_ips = []
        for ip in ips:
            # Ignore private/internal IPs
            if ip.startswith("192.168.") or ip.startswith("10.") or ip.startswith("127.") or ip.startswith("172."):
                continue

            result = await check_ip_reputation(ip, db)
            if result.get("is_malicious"):
                malicious_ips.append(ip)
            
            # Respect rate limits
            await asyncio.sleep(0.5)

        if malicious_ips:
            # Update the parsed_data JSONB column with anomalies
            forensic_record = db.query(models.NetworkForensic).filter(models.NetworkForensic.case_id == case_id).order_by(models.NetworkForensic.created_at.desc()).first()
            if forensic_record:
                # Need to explicitly copy the JSON to modify it in SQLAlchemy
                parsed_data = dict(forensic_record.parsed_data)
                
                anomalies = parsed_data.get("anomalies", [])
                for mip in malicious_ips:
                    anomalies.append(f"Potential C2 Beacon: {mip}")
                
                parsed_data["anomalies"] = anomalies
                forensic_record.parsed_data = parsed_data
                
                db.commit()
    except Exception as e:
        logger.error(f"Background task failed: {e}")
    finally:
        db.close()
