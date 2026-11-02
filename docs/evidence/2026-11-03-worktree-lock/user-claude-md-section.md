## 并行开发与 worktree

- 同一仓库可能同时有多个 Claude Code 会话在工作。
- 如果会话开始时的上下文提示「The main checkout is held by another Claude Code session」，
  或者文件编辑 / git 命令被 hook 以同样理由拒绝：立即调用 EnterWorktree，
  以当前任务的 feature 名（kebab-case）创建 worktree，之后所有工作都在其中进行。
- 进入新 worktree 后，先按项目方式安装依赖；若需要启动 dev server，使用与默认端口不同的端口，避免与其他会话冲突。
- 在 worktree 中只在自己的分支上提交，不要切换、重置或修改主 checkout 的分支和文件。
- 任务完成后告诉用户 worktree 路径和分支名，方便合并。
