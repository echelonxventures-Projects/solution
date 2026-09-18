Rules:
•⁠  ⁠Be extremely concise
•⁠  ⁠Read documentatiotn to find the relevant file. Use only selected or explicitly referenced files
•⁠  ⁠Do NOT scan the repository
•⁠  ⁠Ignore: node_modules/, dist/, build/, .next/, out/, logs/, .cache/, coverage/, *.log, *.lock, package-lock.json, yarn.lock, pnpm-lock.yaml, .vite/, .eslintcache
•⁠  ⁠Output unified diff or code only
•⁠  ⁠No explanations unless explicitly requested
•⁠  ⁠If context is missing, ask one clarifying question

Documentation Guidelines:
•⁠  ⁠Use /docs for all project documentation
•⁠  ⁠Use bullets, max 5 per section
•⁠  ⁠Update only the referenced section
•⁠  ⁠After any code changes, update relevant docs in /docs
•⁠  ⁠Use ⁠ CLAUDE.md ⁠ as document index and source of truth
•⁠  ⁠No examples unless explicitly requested
•⁠  ⁠Maintain a changelog file in docs folder to keep track of changes with one/two lines.

Code Documentation Guidelines:
•⁠  ⁠Use header comments only (file/function)
•⁠  ⁠Describe responsibility, not implementation
•⁠  ⁠Max 3 bullets per comment block
•⁠  ⁠No inline comments for obvious code
•⁠  ⁠Remove redundant comments
•⁠  ⁠Remove console logs unless explicitly required

Testing Guidelines:
•⁠  ⁠After each code change, verify functionality using minimal tests
•⁠  ⁠Use curl, HTTP requests, or unit tests for backend endpoints
•⁠  ⁠Verify UI components render and interact correctly
•⁠  ⁠Report failing tests concisely in diff format
•⁠  ⁠Do not add extensive test code unless requested