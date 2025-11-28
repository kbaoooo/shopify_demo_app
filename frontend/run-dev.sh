#!/usr/bin/env bash
set -e

# luôn đứng tại thư mục frontend
cd "$(dirname "$0")"

echo "Starting Vite dev server on 5173..."
# chạy Vite dev server nền
npm run dev -- --host 0.0.0.0 --port 5173 &
VITE_PID=$!

echo "Starting ngrok for http 5173 (web-port 4041)..."
ngrok http 5173 --web-port 4041 > /dev/null &
NGROK_FE_PID=$!

# chờ ngrok khởi động
sleep 5

# lấy public_url https từ ngrok FE
URL=$(curl -s http://127.0.0.1:4041/api/tunnels \
  | grep -o '"public_url":"https:[^"]*' \
  | head -n1 \
  | sed 's/"public_url":"//')

echo "Frontend ngrok URL: $URL"

# cập nhật FRONTEND_URL trong backend/.env
cd ..

if [ -f "backend/.env" ]; then
  if grep -q "^FRONTEND_URL=" backend/.env; then
    sed -i "s|^FRONTEND_URL=.*|FRONTEND_URL=$URL|" backend/.env
  else
    echo "FRONTEND_URL=$URL" >> backend/.env
  fi
else
  echo "FRONTEND_URL=$URL" > backend/.env
fi

echo "Updated backend/.env: FRONTEND_URL=$URL"

# đợi Vite chạy; khi Vite tắt thì kill ngrok
wait $VITE_PID

echo "Stopping frontend ngrok..."
kill $NGROK_FE_PID || true
