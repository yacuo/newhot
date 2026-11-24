import { readConfigJson } from "@/shared/config/read-config";
import { formatConfigError, searchConfigSchema } from "@/shared/config/schemas";

type Check = {
  name: string;
  run: () => Promise<void> | void;
};

const checks: Check[] = [
  {
    name: "config/global/site.json",
    run: async () => {
      await import("@/shared/config/site.config");
    },
  },
  {
    name: "config/global/content-types.json",
    run: async () => {
      await import("@/entities/article/model/content-types");
    },
  },
  {
    name: "config/global/sources.json",
    run: async () => {
      await import("@/shared/config/sources");
    },
  },
  {
    name: "config/global/search.json",
    run: () => {
      const parsed = searchConfigSchema.safeParse(readConfigJson("global/search.json"));

      if (!parsed.success) {
        throw new Error(formatConfigError(parsed.error, "config/global/search.json"));
      }
    },
  },
  {
    name: "config/channels/*.json",
    run: async () => {
      await import("@/entities/channel/model");
    },
  },
  {
    name: "config/tutorials/**/*.json",
    run: async () => {
      const tutorial = await import("@/entities/tutorial/model");
      tutorial.getTutorialCatalogs();
    },
  },
  {
    name: "config/{about,agent,contact,contribute,home,legal,open-source,shared,themes,tutorials,update-log}",
    run: async () => {
      await import("@/entities/page-content/model");
      await import("@/entities/page-content/model/legal");
    },
  },
];

let failed = 0;

async function main() {
  for (const check of checks) {
    try {
      await check.run();
      console.log(`✓ ${check.name}`);
    } catch (error) {
      failed += 1;
      console.error(`✗ ${check.name}`);
      console.error(`  ${(error as Error).message}`);
    }
  }

  if (failed > 0) {
    console.error(`\n配置校验失败：${failed} 项`);
    process.exit(1);
  }

  console.log(`\n配置校验通过：${checks.length} 项`);
}

main().catch((error) => {
  console.error(`配置校验异常：${(error as Error).message}`);
  process.exit(1);
});
