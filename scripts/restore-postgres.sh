#!/usr/bin/env bash
set -euo pipefail

if [[ $# -lt 1 ]]; then
  echo "Usage: $0 <dump.sql.gz> [database_url]" >&2
  exit 1
fi

DUMP_FILE="$1"
DATABASE_URL="${2:-${DATABASE_URL:-}}"

if [[ -z "${DATABASE_URL}" ]]; then
  echo "DATABASE_URL is required as env var or second argument" >&2
  exit 1
fi

if [[ ! -f "${DUMP_FILE}" ]]; then
  echo "Dump file not found: ${DUMP_FILE}" >&2
  exit 1
fi

CONFIRM="${CONFIRM_RESTORE:-}"
if [[ "${CONFIRM}" != "yes" ]]; then
  echo "Refusing to restore without CONFIRM_RESTORE=yes" >&2
  echo "This operation can overwrite data in the target database." >&2
  exit 1
fi

gunzip -c "${DUMP_FILE}" | psql "${DATABASE_URL}"
