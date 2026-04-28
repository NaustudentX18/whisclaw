#!/bin/bash
# Whisper Bridge - Helper script to call picoclaw agent

PICOCLAW_GATEWAY="${PICOCLAW_GATEWAY:-127.0.0.1:18889}"
TIMEOUT="${WHISCLAW_TIMEOUT_MS:-30000}"

# Check if gateway is reachable
check_gateway() {
    timeout 1 bash -c "cat < /dev/null > /dev/tcp/$PICOCLAW_GATEWAY" 2>/dev/null
    return $?
}

# Main command handler
main() {
    local command="$1"
    shift

    case "$command" in
        "voice")
            # Process voice command via picoclaw
            echo "{\"action\":\"voice\",\"args\":$*}" | nc -w"$TIMEOUT" "$PICOCLAW_GATEWAY" 2>/dev/null
            ;;
        "chat")
            # Process chat command via picoclaw
            echo "{\"action\":\"chat\",\"args\":$*}" | nc -w"$TIMEOUT" "$PICOCLAW_GATEWAY" 2>/dev/null
            ;;
        "status")
            # Get system status
            echo "{\"action\":\"status\"}" | nc -w"$TIMEOUT" "$PICOCLAW_GATEWAY" 2>/dev/null
            ;;
        *)
            # Generic command passthrough
            echo "{\"command\":\"$command\",\"args\":$*}" | nc -w"$TIMEOUT" "$PICOCLAW_GATEWAY" 2>/dev/null
            ;;
    esac
}

# If script is called directly (not sourced)
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
