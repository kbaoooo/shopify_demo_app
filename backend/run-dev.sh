#!/usr/bin/env bash
set -e

# luôn đứng tại thư mục backend (nơi có .env, package.json)
cd "$(dirname "$0")"

echo "Starting ngrok for http 3000... Please wait."
ngrok http 3000 > /dev/null &
NGROK_PID=$!

# chờ ngrok khởi động
sleep 5

# lấy public_url https từ ngrok
URL=$(curl -s http://127.0.0.1:4040/api/tunnels \
  | grep -o '"public_url":"https:[^"]*' \
  | head -n1 \
  | sed 's/"public_url":"//')

echo "Ngrok URL: $URL"

# cập nhật HOST trong backend/.env
if [ -f ".env" ]; then
  if grep -q "^SHOPIFY_HOST=" .env; then
    sed -i "s|^SHOPIFY_HOST=.*|SHOPIFY_HOST=$URL|" .env
  else
    echo "SHOPIFY_HOST=$URL" >> .env
  fi
else
  echo "SHOPIFY_HOST=$URL" > .env
fi

echo "Updated backend/.env: SHOPIFY_HOST=$URL"
echo "Starting NestJS dev..."

# chạy NestJS với hot reload
npm run start:dev

# khi Nest dừng thì kill luôn ngrok
echo "Stopping ngrok..."
kill $NGROK_PID || true
