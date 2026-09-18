# Changelog

## 2026-04-13 - Code Simplification

- Replaced inline session ID generation with shared utility `createSessionId()`
- Fixed stringly-typed error codes to use `ErrorCode` enum throughout booking-service
- Parallelized Fastify plugin registration in user, consultant, and booking services
- Removed redundant TODO comments, replaced with concise action comments
- Cleaned up verbose comments in billing engine
- Removed unused imports (date-fns, generateOTP)
- Fixed typo: `consulantId` → `consultantId`
- Added header comments to all service files (max 2 bullets describing responsibility)
- Removed inline comments explaining obvious code behavior
- Standardized comment format across all routes
