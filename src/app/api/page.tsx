import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

const supabase = createClientComponentClient();

// 连接数据库示例操作，这个方法会自动读取环境变量