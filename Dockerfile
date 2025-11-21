# syntax=docker/dockerfile:1

ARG NODE_VERSION=22.16.0

################################################################################
# Base stage
FROM node:${NODE_VERSION}-alpine as base
WORKDIR /usr/src/app

################################################################################
# Deps stage
FROM base as deps
RUN --mount=type=bind,source=package.json,target=package.json \
    --mount=type=bind,source=package-lock.json,target=package-lock.json \
    --mount=type=cache,target=/root/.npm \
    npm ci --omit=dev

################################################################################
# Build stage
FROM deps as build
RUN --mount=type=bind,source=package.json,target=package.json \
    --mount=type=bind,source=package-lock.json,target=package-lock.json \
    --mount=type=cache,target=/root/.npm \
    npm ci
COPY . .
RUN npm run build

################################################################################
# Final stage - ĐÃ SỬA
FROM base as final

ENV NODE_ENV production

# 1. Cài đặt 'serve' KHI VẪN LÀ ROOT (để không bị lỗi permission)
RUN npm install -g serve

# 2. Copy file cần thiết
# Lưu ý: Với web tĩnh (React/Vue), thực ra không cần node_modules ở bước này,
# nhưng cứ giữ lại nếu project bạn có dùng dependency phía server nào đó đặc biệt.
COPY --from=deps /usr/src/app/node_modules ./node_modules
COPY --from=build /usr/src/app/build ./build
COPY package.json .

# 3. Đổi quyền sở hữu file cho user 'node' (Quan trọng để tránh lỗi permission khi chạy)
RUN chown -R node:node /usr/src/app

# 4. Bây giờ mới chuyển sang user node để chạy cho an toàn
USER node

EXPOSE 3000

# 5. Dùng lệnh 'serve' để chạy folder build
CMD ["serve", "-s", "build", "-l", "3000"]