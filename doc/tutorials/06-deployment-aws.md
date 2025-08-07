# AWS デプロイメント戦略：バックエンドエンジニア向け解説

## Next.js アプリケーションのデプロイメント選択肢

Next.js アプリケーションは、その性質上複数のデプロイメント方式に対応できます。バックエンドエンジニアが慣れ親しんだAWSサービスでの展開方法を説明します。

## 1. Server-Side Rendering (SSR) vs Static Site Generation (SSG)

### サーバーサイドアプリケーションとの比較

#### 従来のサーバーサイド（Rails）
```ruby
class CalendarController < ApplicationController
  def calendar
    @practices = practice_service.get_all_practices
    render 'calendar' # サーバーでHTMLを生成
  end
end
```

#### Next.js SSR（サーバーサイド レンダリング）
```typescript
// src/app/calendar/page.tsx
export default async function CalendarPage() {
  // サーバーで実行（リクエスト毎）
  const practices = await fetch('https://api.example.com/practices').then(res => res.json());
  
  return <Calendar practices={practices} />; // サーバーでHTMLを生成
}
```

#### Next.js SSG（静的サイト生成）
```typescript
// ビルド時に実行（一回のみ）
export async function generateStaticParams() {
  const practices = await fetch('https://api.example.com/practices').then(res => res.json());
  
  return practices.map(practice => ({
    id: practice.id,
  }));
}

export default function PracticePage({ params }: { params: { id: string } }) {
  // 静的なHTMLファイルとして生成
  return <div>Practice {params.id}</div>;
}
```

### 本プロジェクトでの選択
現在のプロジェクトは **Client-Side Rendering (CSR)** で実装されており、以下の選択肢があります：

1. **SSR**: ユーザーリクエスト毎にサーバーで HTML 生成
2. **SSG**: ビルド時に静的ファイル生成
3. **CSR**: ブラウザで動的に HTML 生成（現在の実装）

## 2. AWS App Runner でのデプロイメント（最も簡単）

### Rails でのデプロイメントとの比較

#### Docker コンテナでの Rails
```dockerfile
# Dockerfile (Rails)
FROM ruby:3.2-slim
WORKDIR /app
COPY Gemfile Gemfile.lock ./
RUN bundle install --without development test
COPY . .
EXPOSE 3000
CMD ["bundle", "exec", "puma", "-C", "config/puma.rb"]
```

#### Docker コンテナでの Next.js
```dockerfile
# Dockerfile (Next.js)
FROM node:18-alpine AS base

# 依存関係インストール
FROM base AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

# ビルド
FROM base AS builder
WORKDIR /app
COPY . .
COPY --from=deps /app/node_modules ./node_modules
RUN npm run build

# 実行
FROM base AS runner
WORKDIR /app
ENV NODE_ENV production
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
ENV PORT 3000

CMD ["node", "server.js"]
```

### App Runner の設定
```yaml
# apprunner.yaml
version: 1.0
runtime: nodejs18
build:
  commands:
    build:
      - npm ci
      - npm run build
run:
  runtime-version: 18
  command: npm start
  network:
    port: 3000
    env: PORT
  env:
    - name: NODE_ENV
      value: "production"
```

### デプロイメント手順
```bash
# 1. リポジトリにapprunner.yamlをコミット
git add apprunner.yaml
git commit -m "Add App Runner configuration"

# 2. AWS CLI で App Runner サービス作成
aws apprunner create-service \
  --service-name "choir-management" \
  --source-configuration '{
    "ImageRepository": {
      "ImageConfiguration": {
        "Port": "3000"
      }
    },
    "CodeRepository": {
      "RepositoryUrl": "https://github.com/yourusername/chor_team_management",
      "SourceCodeVersion": {
        "Type": "BRANCH",
        "Value": "main"
      },
      "CodeConfiguration": {
        "ConfigurationSource": "REPOSITORY"
      }
    }
  }' \
  --auto-scaling-configuration-arn "arn:aws:apprunner:region:account:autoscalingconfiguration/default"
```

## 3. ECS Fargate でのデプロイメント

### ECS タスク定義
```json
{
  "family": "choir-management",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "256",
  "memory": "512",
  "executionRoleArn": "arn:aws:iam::123456789012:role/ecsTaskExecutionRole",
  "containerDefinitions": [
    {
      "name": "nextjs-app",
      "image": "your-ecr-repo/choir-management:latest",
      "portMappings": [
        {
          "containerPort": 3000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "NODE_ENV",
          "value": "production"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/choir-management",
          "awslogs-region": "ap-northeast-1",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ]
}
```

### ECS サービス作成（Terraform）
```hcl
# ecs.tf
resource "aws_ecs_cluster" "main" {
  name = "choir-management"
}

resource "aws_ecs_task_definition" "app" {
  family                   = "choir-management"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                     = 256
  memory                  = 512
  execution_role_arn      = aws_iam_role.ecs_task_execution_role.arn

  container_definitions = jsonencode([
    {
      name  = "nextjs-app"
      image = "${aws_ecr_repository.app.repository_url}:latest"
      
      portMappings = [
        {
          containerPort = 3000
          hostPort      = 3000
        }
      ]
      
      environment = [
        {
          name  = "NODE_ENV"
          value = "production"
        }
      ]

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.ecs_logs.name
          "awslogs-region"        = "ap-northeast-1"
          "awslogs-stream-prefix" = "ecs"
        }
      }
    }
  ])
}

resource "aws_ecs_service" "main" {
  name            = "choir-management"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.app.arn
  desired_count   = 2
  launch_type     = "FARGATE"

  network_configuration {
    security_groups  = [aws_security_group.ecs_tasks.id]
    subnets          = aws_subnet.private.*.id
    assign_public_ip = false
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.app.arn
    container_name   = "nextjs-app"
    container_port   = 3000
  }

  depends_on = [aws_lb_listener.front_end]
}
```

## 4. Lambda + API Gateway でのサーバーレスデプロイ

### サーバーレス Next.js（OpenNext を使用）
```yaml
# serverless.yml
service: choir-management

provider:
  name: aws
  runtime: nodejs18.x
  region: ap-northeast-1
  stage: ${opt:stage, 'dev'}

plugins:
  - serverless-nextjs-plugin

custom:
  nextjs:
    nextConfigDir: './'
    
resources:
  Resources:
    # CloudFront Distribution for static assets
    NextjsDistribution:
      Type: AWS::CloudFront::Distribution
      Properties:
        DistributionConfig:
          Origins:
            - Id: NextjsOrigin
              DomainName: !GetAtt NextjsLambda.FunctionName
              CustomOriginConfig:
                HTTPPort: 443
                OriginProtocolPolicy: https-only
          DefaultCacheBehavior:
            TargetOriginId: NextjsOrigin
            ViewerProtocolPolicy: redirect-to-https
            CachePolicyId: 4135ea2d-6df8-44a3-9df3-4b5a84be39ad
```

### Lambda 関数での実装
```typescript
// pages/api/practices.ts （API Routes）
import { NextApiRequest, NextApiResponse } from 'next';
import { samplePractices } from '@/data/sampleData';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    // クエリパラメータでフィルタリング
    const { teamIds } = req.query;
    
    let filteredPractices = samplePractices;
    if (teamIds) {
      const teamIdArray = Array.isArray(teamIds) ? teamIds : [teamIds];
      filteredPractices = samplePractices.filter(practice => 
        teamIdArray.includes(practice.choirTeamId)
      );
    }
    
    res.status(200).json(filteredPractices);
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
```

## 5. S3 + CloudFront での静的サイトデプロイ

### 静的エクスポート設定
```typescript
// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export', // 静的エクスポートを有効化
  trailingSlash: true,
  images: {
    unoptimized: true // S3では画像最適化が使えないため
  }
}

module.exports = nextConfig;
```

### ビルドと デプロイスクリプト
```bash
#!/bin/bash
# deploy-static.sh

# 静的サイトをビルド
npm run build

# S3にアップロード  
aws s3 sync out/ s3://choir-management-static-site --delete

# CloudFrontのキャッシュを無効化
aws cloudfront create-invalidation \
  --distribution-id E1234567890123 \
  --paths "/*"

echo "デプロイが完了しました"
echo "URL: https://d1234567890123.cloudfront.net"
```

### Terraform での インフラ構築
```hcl
# s3-cloudfront.tf
resource "aws_s3_bucket" "static_site" {
  bucket = "choir-management-static-site"
}

resource "aws_s3_bucket_website_configuration" "static_site" {
  bucket = aws_s3_bucket.static_site.id

  index_document {
    suffix = "index.html"
  }

  error_document {
    key = "404.html"
  }
}

resource "aws_s3_bucket_policy" "static_site" {
  bucket = aws_s3_bucket.static_site.id

  policy = jsonencode({
    Statement = [
      {
        Sid       = "PublicReadGetObject"
        Effect    = "Allow"
        Principal = "*"
        Action    = "s3:GetObject"
        Resource  = "${aws_s3_bucket.static_site.arn}/*"
      }
    ]
  })
}

resource "aws_cloudfront_distribution" "static_site" {
  origin {
    domain_name = aws_s3_bucket.static_site.bucket_regional_domain_name
    origin_id   = "S3-${aws_s3_bucket.static_site.bucket}"

    s3_origin_config {
      origin_access_identity = aws_cloudfront_origin_access_identity.static_site.cloudfront_access_identity_path
    }
  }

  enabled             = true
  is_ipv6_enabled     = true
  default_root_object = "index.html"

  default_cache_behavior {
    allowed_methods        = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods         = ["GET", "HEAD"]
    target_origin_id       = "S3-${aws_s3_bucket.static_site.bucket}"
    compress               = true
    viewer_protocol_policy = "redirect-to-https"

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    cloudfront_default_certificate = true
  }
}
```

## 6. AWS Amplify でのフルマネージドデプロイ

### Amplify 設定ファイル
```yaml
# amplify.yml
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - npm ci
    build:
      commands:
        - npm run build
  artifacts:
    baseDirectory: .next
    files:
      - '**/*'
  cache:
    paths:
      - node_modules/**/*
      - .next/cache/**/*
```

### 環境変数設定
```bash
# Amplify Console で設定する環境変数
NODE_ENV=production
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
```

### CLI でのデプロイ
```bash
# Amplify CLI インストール
npm install -g @aws-amplify/cli

# プロジェクト初期化
amplify init

# ホスティング設定
amplify add hosting

# デプロイ
amplify publish
```

## 7. CI/CD パイプライン構築

### GitHub Actions での自動デプロイ
```yaml
# .github/workflows/deploy.yml
name: Deploy to AWS

on:
  push:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Run tests
        run: npm test
        
      - name: Build application
        run: npm run build

  deploy-staging:
    needs: test
    runs-on: ubuntu-latest
    environment: staging
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v2
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ap-northeast-1
          
      - name: Login to Amazon ECR
        id: login-ecr
        uses: aws-actions/amazon-ecr-login@v1
        
      - name: Build, tag, and push image to Amazon ECR
        env:
          ECR_REGISTRY: ${{ steps.login-ecr.outputs.registry }}
          ECR_REPOSITORY: choir-management
          IMAGE_TAG: ${{ github.sha }}
        run: |
          docker build -t $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG .
          docker push $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG
          
      - name: Deploy to ECS
        run: |
          aws ecs update-service \
            --cluster choir-management \
            --service choir-management \
            --force-new-deployment

  deploy-production:
    needs: test
    runs-on: ubuntu-latest
    environment: production
    if: github.ref == 'refs/heads/main'
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Deploy to production
        run: |
          # 本番デプロイのスクリプト
          echo "Deploying to production..."
```

## 8. モニタリングとログ管理

### CloudWatch ログ設定
```typescript
// logger.ts
import { createLogger, format, transports } from 'winston';
import AWS from 'aws-sdk';

const cloudWatchLogs = new AWS.CloudWatchLogs({
  region: 'ap-northeast-1'
});

export const logger = createLogger({
  level: 'info',
  format: format.combine(
    format.timestamp(),
    format.errors({ stack: true }),
    format.json()
  ),
  transports: [
    new transports.Console(),
    // CloudWatch Logs への送信
    new (require('winston-cloudwatch'))({
      logGroupName: '/aws/lambda/choir-management',
      logStreamName: 'application-logs',
      awsRegion: 'ap-northeast-1',
      awsAccessKeyId: process.env.AWS_ACCESS_KEY_ID,
      awsSecretKey: process.env.AWS_SECRET_ACCESS_KEY
    })
  ]
});

// 使用例
export default function handler(req: NextApiRequest, res: NextApiResponse) {
  logger.info('API request received', {
    method: req.method,
    url: req.url,
    userAgent: req.headers['user-agent']
  });
  
  try {
    // API処理
    res.status(200).json({ success: true });
  } catch (error) {
    logger.error('API error occurred', {
      error: error.message,
      stack: error.stack
    });
    res.status(500).json({ error: 'Internal server error' });
  }
}
```

### X-Ray トレーシング
```typescript
// tracing.ts
import AWSXRay from 'aws-xray-sdk-core';
import AWS from 'aws-sdk';

// AWS SDK をトレース対象に
const tracedAWS = AWSXRay.captureAWS(AWS);

// Next.js API での使用例
export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const segment = AWSXRay.getSegment();
  
  // サブセグメント作成
  const subsegment = segment?.addNewSubsegment('database-query');
  
  try {
    // データベースクエリなどの処理
    const practices = getPractices();
    
    subsegment?.close();
    res.status(200).json(practices);
  } catch (error) {
    subsegment?.addError(error);
    subsegment?.close();
    throw error;
  }
}
```

## 9. セキュリティ設定

### WAF 設定（Terraform）
```hcl
# waf.tf
resource "aws_wafv2_web_acl" "main" {
  name  = "choir-management-waf"
  scope = "CLOUDFRONT"

  default_action {
    allow {}
  }

  rule {
    name     = "RateLimitRule"
    priority = 1

    override_action {
      none {}
    }

    statement {
      rate_based_statement {
        limit              = 2000
        aggregate_key_type = "IP"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "RateLimitRule"
      sampled_requests_enabled   = true
    }

    action {
      block {}
    }
  }

  rule {
    name     = "AWSManagedRulesCommonRuleSet"
    priority = 2

    override_action {
      none {}
    }

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesCommonRuleSet"
        vendor_name = "AWS"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "CommonRuleSetMetric"
      sampled_requests_enabled   = true
    }
  }
}
```

### セキュリティヘッダー設定
```typescript
// next.config.js
const securityHeaders = [
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on'
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload'
  },
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block'
  },
  {
    key: 'X-Frame-Options',
    value: 'DENY'
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  },
  {
    key: 'Referrer-Policy',
    value: 'origin-when-cross-origin'
  }
];

module.exports = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      }
    ];
  }
};
```

## 10. コスト最適化

### デプロイメント方式別コスト比較

| デプロイ方式 | 月額コスト（目安） | メリット | デメリット |
|---|---|---|---|
| S3 + CloudFront | $5-20 | 最安、高速配信 | サーバー機能不可 |
| Lambda + API Gateway | $10-50 | サーバーレス、自動スケール | コールドスタート |
| ECS Fargate | $30-100 | 柔軟性、常時起動 | 管理コスト |
| App Runner | $25-80 | 簡単設定、自動スケール | カスタマイズ制限 |
| Amplify | $15-60 | フルマネージド | ベンダーロックイン |

### リソース監視とアラート
```hcl
# cloudwatch-alarms.tf
resource "aws_cloudwatch_metric_alarm" "high_cost" {
  alarm_name          = "high-monthly-cost"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "EstimatedCharges"
  namespace           = "AWS/Billing"
  period              = "86400"
  statistic           = "Maximum"
  threshold           = "100"
  alarm_description   = "This metric monitors monthly cost"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    Currency = "USD"
  }
}
```

## まとめ

Next.js アプリケーションのAWSデプロイには複数の選択肢があります：

1. **開発・検証環境**: S3 + CloudFront（静的サイト）
2. **小規模本番環境**: AWS App Runner
3. **中規模本番環境**: ECS Fargate + ALB
4. **大規模本番環境**: Lambda + API Gateway + CloudFront
5. **簡単運用**: AWS Amplify

本プロジェクトのような小規模なアプリケーションであれば、**AWS App Runner** または **Amplify** が最適です。バックエンドエンジニアが慣れ親しんだECSでの運用も可能で、既存インフラとの統合も容易に行えます。