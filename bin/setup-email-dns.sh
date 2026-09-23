#!/bin/bash
set -euo pipefail

# ─────────────────────────────────────────────────────────────────────────────
# SyncBay Email DNS Setup Script
# Automates: Resend domain → DNS records → Vercel CLI → .env.local update
# ─────────────────────────────────────────────────────────────────────────────

DOMAIN="syncbay.app"
ENV_FILE="$(dirname "$0")/../.env.local"

echo ""
echo "╔══════════════════════════════════════════════════════════╗"
echo "║        SyncBay Email DNS Setup Automation               ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""

# ─── Step 1: Get Resend API Key ──────────────────────────────────────────────
echo "┌─────────────────────────────────────────────────────────┐"
echo "│  STEP 1: Resend API Key                                │"
echo "├─────────────────────────────────────────────────────────┤"
echo "│  1. Go to: https://resend.com/signup                   │"
echo "│  2. Sign up (GitHub OAuth is fastest)                  │"
echo "│  3. Go to: https://resend.com/api-keys                 │"
echo "│  4. Create key: 'syncbay-production' / Full Access     │"
echo "│  5. Copy the key (starts with re_)                     │"
echo "└─────────────────────────────────────────────────────────┘"
echo ""
read -rp "Paste your Resend API Key: " RESEND_API_KEY

if [[ ! "$RESEND_API_KEY" =~ ^re_ ]]; then
  echo "⚠  Warning: Key doesn't start with 're_'. Continuing anyway..."
fi

# ─── Step 2: Add domain to Resend via API ────────────────────────────────────
echo ""
echo "⏳ Adding domain '$DOMAIN' to Resend..."

RESEND_RESPONSE=$(curl -s -X POST "https://api.resend.com/domains" \
  -H "Authorization: Bearer $RESEND_API_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"name\": \"$DOMAIN\"}")

echo "   Resend response: $RESEND_RESPONSE"

# Check for error
if echo "$RESEND_RESPONSE" | grep -q '"statusCode"'; then
  echo ""
  echo "⚠  Resend returned an error. The domain may already exist."
  echo "   Trying to fetch existing domain records..."
  
  # List domains to find the domain ID
  DOMAINS_LIST=$(curl -s "https://api.resend.com/domains" \
    -H "Authorization: Bearer $RESEND_API_KEY")
  
  DOMAIN_ID=$(echo "$DOMAINS_LIST" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
  
  if [ -n "$DOMAIN_ID" ]; then
    RESEND_RESPONSE=$(curl -s "https://api.resend.com/domains/$DOMAIN_ID" \
      -H "Authorization: Bearer $RESEND_API_KEY")
  fi
fi

echo ""
echo "✅ Domain registered with Resend"

# ─── Step 3: Extract DNS records from Resend response ────────────────────────
echo ""
echo "⏳ Extracting DNS records from Resend..."

# Extract records array - parse the JSON for DNS records
RECORDS=$(echo "$RESEND_RESPONSE" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    records = data.get('records', [])
    for r in records:
        rtype = r.get('record_type', r.get('type', ''))
        name = r.get('name', '')
        value = r.get('value', '')
        priority = r.get('priority', '')
        status = r.get('status', '')
        print(f'{rtype}|{name}|{value}|{priority}|{status}')
except Exception as e:
    print(f'ERROR|{e}', file=sys.stderr)
    # Try alternate parsing
    data = json.load(open('/dev/stdin'))
" 2>&1)

if echo "$RECORDS" | grep -q "ERROR"; then
  echo "⚠  Could not auto-parse. Dumping raw response:"
  echo "$RESEND_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$RESEND_RESPONSE"
  echo ""
  echo "Please manually extract the values below:"
  echo ""
  read -rp "DKIM CNAME name (e.g. resend._domainkey): " DKIM_NAME
  read -rp "DKIM CNAME value: " DKIM_VALUE
  read -rp "Bounce CNAME name (e.g. bounces): " BOUNCE_NAME
  read -rp "Bounce CNAME value: " BOUNCE_VALUE
else
  echo ""
  echo "   Found DNS records from Resend:"
  echo "   ──────────────────────────────────────"
  
  DKIM_NAME=""
  DKIM_VALUE=""
  BOUNCE_NAME=""
  BOUNCE_VALUE=""
  SPF_VALUE=""
  
  while IFS='|' read -r rtype name value priority status; do
    echo "   $rtype  $name → $value  ($status)"
    
    # Match DKIM record (CNAME with _domainkey in name)
    if [[ "$name" == *"_domainkey"* ]] || [[ "$name" == *"dkim"* && "$rtype" == "CNAME" ]]; then
      DKIM_NAME="$name"
      DKIM_VALUE="$value"
    fi
    
    # Match bounce/return-path record
    if [[ "$name" == *"bounces"* ]] || [[ "$name" == *"return"* ]] || [[ "$name" == *"mail"* && "$rtype" == "CNAME" ]]; then
      BOUNCE_NAME="$name"
      BOUNCE_VALUE="$value"
    fi
    
    # Match SPF record
    if [[ "$rtype" == "TXT" && "$value" == *"spf"* ]]; then
      SPF_VALUE="$value"
    fi
    
    # Also catch MX-type CNAME records used for bounce
    if [[ "$rtype" == "MX" ]] || [[ "$name" == *"bounce"* ]]; then
      if [ -z "$BOUNCE_NAME" ]; then
        BOUNCE_NAME="$name"
        BOUNCE_VALUE="$value"
      fi
    fi
  done <<< "$RECORDS"
  
  echo ""
  
  # Confirm extracted values
  if [ -z "$DKIM_NAME" ]; then
    read -rp "   Could not auto-detect DKIM name. Enter it: " DKIM_NAME
    read -rp "   Enter DKIM CNAME value: " DKIM_VALUE
  fi
  
  if [ -z "$BOUNCE_NAME" ]; then
    read -rp "   Could not auto-detect bounce name. Enter it: " BOUNCE_NAME
    read -rp "   Enter bounce CNAME value: " BOUNCE_VALUE
  fi
fi

echo ""
echo "   DKIM:   $DKIM_NAME → $DKIM_VALUE"
echo "   Bounce: $BOUNCE_NAME → $BOUNCE_VALUE"

# ─── Step 4: Add Resend DNS records to Vercel ────────────────────────────────
echo ""
echo "⏳ Adding Resend DNS records to Vercel..."

# Strip domain suffix from record names for Vercel CLI
# Vercel wants just the subdomain part, not the full FQDN
DKIM_SUB=$(echo "$DKIM_NAME" | sed "s/\\.${DOMAIN}$//" | sed "s/\\.${DOMAIN}\.$//" )
BOUNCE_SUB=$(echo "$BOUNCE_NAME" | sed "s/\\.${DOMAIN}$//" | sed "s/\\.${DOMAIN}\.$//" )

echo "   Adding DKIM CNAME: $DKIM_SUB → $DKIM_VALUE"
vercel dns add "$DOMAIN" "$DKIM_SUB" CNAME "$DKIM_VALUE" 2>&1 && echo "   ✅ DKIM added" || echo "   ⚠  DKIM may already exist"

echo "   Adding Bounce CNAME: $BOUNCE_SUB → $BOUNCE_VALUE"
vercel dns add "$DOMAIN" "$BOUNCE_SUB" CNAME "$BOUNCE_VALUE" 2>&1 && echo "   ✅ Bounce added" || echo "   ⚠  Bounce may already exist"

# ─── Step 5: Zoho Mail verification ─────────────────────────────────────────
echo ""
echo "┌─────────────────────────────────────────────────────────┐"
echo "│  STEP 5: Zoho Mail Free Setup                          │"
echo "├─────────────────────────────────────────────────────────┤"
echo "│  1. Go to: https://www.zoho.com/mail/zohomail-pricing  │"
echo "│  2. Sign up for 'Forever Free' plan                    │"
echo "│  3. Add domain: syncbay.app                            │"
echo "│  4. Copy the verification TXT value                    │"
echo "│  5. After verify, go to Admin → Email Config → DKIM    │"
echo "│  6. Generate DKIM and copy the TXT value               │"
echo "└─────────────────────────────────────────────────────────┘"
echo ""
read -rp "Zoho verification TXT value (e.g. zoho-verification=zb_xxxxx): " ZOHO_VERIFY
read -rp "Zoho DKIM selector name (usually 'zmail._domainkey', press Enter for default): " ZOHO_DKIM_NAME
ZOHO_DKIM_NAME=${ZOHO_DKIM_NAME:-zmail._domainkey}
read -rp "Zoho DKIM TXT value: " ZOHO_DKIM_VALUE

echo ""
echo "⏳ Adding Zoho DNS records to Vercel..."

echo "   Adding Zoho verification TXT..."
vercel dns add "$DOMAIN" @ TXT "$ZOHO_VERIFY" 2>&1 && echo "   ✅ Verification TXT added" || echo "   ⚠  May already exist"

ZOHO_DKIM_SUB=$(echo "$ZOHO_DKIM_NAME" | sed "s/\\.${DOMAIN}$//" | sed "s/\\.${DOMAIN}\.$//" )
echo "   Adding Zoho DKIM TXT: $ZOHO_DKIM_SUB..."
vercel dns add "$DOMAIN" "$ZOHO_DKIM_SUB" TXT "$ZOHO_DKIM_VALUE" 2>&1 && echo "   ✅ DKIM added" || echo "   ⚠  May already exist"

# ─── Step 6: Update .env.local ───────────────────────────────────────────────
echo ""
echo "⏳ Updating .env.local..."

# Update RESEND_API_KEY in .env.local
if grep -q 'RESEND_API_KEY=' "$ENV_FILE"; then
  sed -i "s|^RESEND_API_KEY=.*|RESEND_API_KEY=\"$RESEND_API_KEY\"|" "$ENV_FILE"
  echo "   ✅ Updated RESEND_API_KEY in .env.local"
else
  echo "RESEND_API_KEY=\"$RESEND_API_KEY\"" >> "$ENV_FILE"
  echo "   ✅ Added RESEND_API_KEY to .env.local"
fi

# Ensure EMAIL_FROM is set
if ! grep -q 'EMAIL_FROM=' "$ENV_FILE"; then
  echo 'EMAIL_FROM="Syncbay <no-reply@syncbay.app>"' >> "$ENV_FILE"
  echo "   ✅ Added EMAIL_FROM to .env.local"
fi

# ─── Step 7: Verify all records ──────────────────────────────────────────────
echo ""
echo "⏳ Final DNS verification..."
echo ""
vercel dns ls "$DOMAIN" 2>&1

echo ""
echo "╔══════════════════════════════════════════════════════════╗"
echo "║  ✅  SETUP COMPLETE!                                    ║"
echo "╠══════════════════════════════════════════════════════════╣"
echo "║                                                        ║"
echo "║  DNS records added to Vercel for syncbay.app:          ║"
echo "║  • 3x MX records → Zoho Mail (already added earlier)  ║"
echo "║  • 1x SPF TXT (Resend + Zoho combined)                ║"
echo "║  • 1x DMARC TXT (p=quarantine)                        ║"
echo "║  • 1x Resend DKIM CNAME                               ║"
echo "║  • 1x Resend Bounce CNAME                             ║"
echo "║  • 1x Zoho verification TXT                           ║"
echo "║  • 1x Zoho DKIM TXT                                   ║"
echo "║                                                        ║"
echo "║  .env.local updated with RESEND_API_KEY                ║"
echo "║                                                        ║"
echo "║  NEXT: Go back to Zoho Admin Console and click         ║"
echo "║  'Verify' to complete domain verification.             ║"
echo "║                                                        ║"
echo "║  Propagation may take 15-60 minutes.                   ║"
echo "║  Test with: https://www.mail-tester.com                ║"
echo "║                                                        ║"
echo "╚══════════════════════════════════════════════════════════╝"
