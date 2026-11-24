# ops 脚本索引

脚本会自行切到项目根目录，在任意目录执行都可以。

## 本地预览

| 脚本 | 作用 |
| --- | --- |
| `dev-restart-preview.sh` | 重启本地 Astro 预览服务，默认端口 3618 |
| `dev-stop-preview.sh` | 停止本地 Astro 预览服务 |

```bash
bash ops/dev-restart-preview.sh
bash ops/dev-stop-preview.sh
```

公开仓库的预览固定使用仓库内示例内容，不受外部 `CONTENT_DIR` 影响。
