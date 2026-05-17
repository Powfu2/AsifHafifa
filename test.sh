#!/bin/bash

URL="http://localhost:8080/products/?name=sss"
CONCURRENCY=50
DURATION=30
END=$((SECONDS + DURATION))

run_request() {
  curl -s -o /dev/null -w "%{http_code} %{time_total}\n" "$URL"
}

export -f run_request
export URL

echo "Starting load test on $URL"
echo "Concurrency: $CONCURRENCY | Duration: ${DURATION}s"
echo "---"

while [ $SECONDS -lt $END ]; do
  seq $CONCURRENCY | xargs -P $CONCURRENCY -I{} bash -c 'run_request'
done | tee /tmp/loadtest_results.txt

echo ""
echo "=== Results ==="
total=$(wc -l < /tmp/loadtest_results.txt)
success=$(grep -c "^200" /tmp/loadtest_results.txt || true)
echo "Total requests : $total"
echo "HTTP 200       : $success"
echo "Errors         : $((total - success))"
awk '{sum+=$2} END {printf "Avg response   : %.3fs\n", sum/NR}' /tmp/loadtest_results.txt
