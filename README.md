# 家庭任务管理系统

一个简洁高效的家庭 Todo List 管理系统，基于 PHP + MySQL 开发。

## 功能特性

- 👥 **多用户管理** - 家庭成员注册和登录
- ✅ **任务管理** - 创建、编辑、删除、分配任务
- 🎯 **优先级设置** - 高/中/低三级优先级
- 📊 **状态跟踪** - 待处理/进行中/已完成/已取消
- 🔍 **筛选功能** - 按状态快速筛选任务
- 📱 **响应式设计** - 支持手机、平板、电脑访问

## 技术栈

- **后端**: PHP 7.4+
- **数据库**: MySQL 5.7+
- **前端**: 原生 JavaScript + CSS3
- **架构**: RESTful API

## 目录结构

```
family-task-manager/
├── api/                  # API接口
│   ├── auth.php         # 认证接口
│   ├── tasks.php        # 任务接口
│   └── users.php        # 用户接口
├── config/              # 配置文件
│   ├── Database.php     # 数据库连接类
│   ├── config.example.php
│   └── database.example.php
├── database/            # 数据库脚本
│   └── schema.sql       # 建表语句
├── public/              # 公共资源
│   ├── css/
│   │   └── style.css    # 样式文件
│   ├── js/
│   │   └── app.js       # 前端逻辑
│   └── index.php        # 入口文件
└── README.md
```

## 安装部署

### 环境要求

- PHP >= 7.4
- MySQL >= 5.7
- Web 服务器（Apache/Nginx）

### 宝塔面板部署步骤

1. **创建网站**
   - 登录宝塔面板
   - 点击「网站」→「添加站点」
   - 填写域名或IP，PHP版本选择 7.4 或更高
   - 数据库选择 MySQL，记录数据库名、用户名、密码

2. **上传代码**
   ```bash
   # 方式1：通过宝塔文件管理上传
   # 将所有文件上传到网站根目录

   # 方式2：通过 Git 克隆
   cd /www/wwwroot/your-domain
   git clone https://github.com/DylanChiang-Dev/family-task-manager.git .
   ```

3. **配置数据库**
   ```bash
   # 复制配置文件
   cp config/database.example.php config/database.php
   cp config/config.example.php config/config.php

   # 编辑 config/database.php，填入数据库信息
   ```

4. **导入数据库**
   - 在宝塔面板 phpMyAdmin 中
   - 选择创建的数据库
   - 导入 `database/schema.sql` 文件

5. **设置网站运行目录**
   - 在网站设置中
   - 将运行目录设置为 `public`

6. **设置伪静态（可选）**
   - 如果使用 Nginx，添加以下规则：
   ```nginx
   location / {
       try_files $uri $uri/ /index.php?$query_string;
   }
   ```

7. **设置权限**
   ```bash
   # 确保目录权限正确
   chmod -R 755 /www/wwwroot/your-domain
   chown -R www:www /www/wwwroot/your-domain
   ```

### 本地开发部署

1. **克隆仓库**
   ```bash
   git clone https://github.com/DylanChiang-Dev/family-task-manager.git
   cd family-task-manager
   ```

2. **配置环境**
   ```bash
   cp config/database.example.php config/database.php
   cp config/config.example.php config/config.php
   ```

3. **修改配置文件**
   编辑 `config/database.php` 和 `config/config.php`，填入对应信息

4. **导入数据库**
   ```bash
   mysql -u root -p < database/schema.sql
   ```

5. **启动服务**
   ```bash
   # 使用 PHP 内置服务器
   cd public
   php -S localhost:8000
   ```

6. **访问应用**
   打开浏览器访问 `http://localhost:8000`

## 默认账户

- 用户名: `admin`
- 密码: `admin123`

**⚠️ 首次登录后请立即修改密码！**

## 使用说明

1. **注册账号** - 家庭成员使用注册功能创建账号
2. **登录系统** - 使用用户名和密码登录
3. **创建任务** - 点击「新建任务」按钮创建新任务
4. **分配任务** - 可以将任务分配给家庭成员
5. **管理任务** - 点击任务卡片可编辑任务状态、优先级等
6. **筛选任务** - 使用顶部标签快速筛选不同状态的任务

## 数据库结构

### users - 用户表
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INT | 主键 |
| username | VARCHAR(50) | 用户名 |
| password | VARCHAR(255) | 密码（加密） |
| nickname | VARCHAR(50) | 昵称 |
| role | ENUM | 角色（admin/member） |

### tasks - 任务表
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INT | 主键 |
| title | VARCHAR(200) | 任务标题 |
| description | TEXT | 任务描述 |
| creator_id | INT | 创建者ID |
| assignee_id | INT | 负责人ID |
| priority | ENUM | 优先级 |
| status | ENUM | 状态 |
| due_date | DATETIME | 截止时间 |

## 安全建议

1. **修改默认密码** - 首次部署后立即修改 admin 账户密码
2. **HTTPS** - 生产环境建议启用 HTTPS
3. **定期备份** - 定期备份数据库
4. **更新依赖** - 保持 PHP 和 MySQL 版本更新

## 贡献

欢迎提交 Issue 和 Pull Request！

## 许可证

MIT License

## 作者

DylanChiang

## 联系方式

如有问题，请在 GitHub 提交 Issue。

---

⭐ 如果这个项目对你有帮助，请给个 Star！
