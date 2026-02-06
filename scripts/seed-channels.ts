import { db } from '../src/lib/db';
import { channels } from '../src/lib/db/schema';
import { v4 as uuidv4 } from 'uuid';

const channelData = [
  // 직접적 니즈 표현 (Direct Needs)
  {
    name: 'Reddit r/SomebodyMakeThis',
    rssUrl: 'https://www.reddit.com/r/SomebodyMakeThis/new/.rss',
    shortCode: 'SMT',
    category: 'direct_needs',
  },
  {
    name: 'Reddit r/AppIdeas',
    rssUrl: 'https://www.reddit.com/r/AppIdeas/new/.rss',
    shortCode: 'APP',
    category: 'direct_needs',
  },
  {
    name: 'Hacker News Ask HN',
    rssUrl: 'https://hnrss.org/ask',
    shortCode: 'ASK',
    category: 'direct_needs',
  },
  // 트렌드/경쟁 분석 (Trends & Competition)
  {
    name: 'Product Hunt',
    rssUrl: 'https://www.producthunt.com/feed',
    shortCode: 'PH',
    category: 'trends',
  },
  {
    name: 'BetaList',
    rssUrl: 'https://betalist.com/feed',
    shortCode: 'BETA',
    category: 'trends',
  },
  {
    name: 'Hacker News Show HN',
    rssUrl: 'https://hnrss.org/show',
    shortCode: 'SHOW',
    category: 'trends',
  },
  // 빌더 커뮤니티 (Builder Communities)
  {
    name: 'Reddit r/startups',
    rssUrl: 'https://www.reddit.com/r/startups/new/.rss',
    shortCode: 'START',
    category: 'builders',
  },
  {
    name: 'Reddit r/Entrepreneur',
    rssUrl: 'https://www.reddit.com/r/Entrepreneur/new/.rss',
    shortCode: 'ENTR',
    category: 'builders',
  },
  {
    name: 'Reddit r/SaaS',
    rssUrl: 'https://www.reddit.com/r/SaaS/new/.rss',
    shortCode: 'SAAS',
    category: 'builders',
  },
  {
    name: 'Reddit r/SideProject',
    rssUrl: 'https://www.reddit.com/r/SideProject/new/.rss',
    shortCode: 'SIDE',
    category: 'builders',
  },
  {
    name: 'Indie Hackers',
    rssUrl: 'https://www.indiehackers.com/feed.xml',
    shortCode: 'IH',
    category: 'builders',
  },
  // 전략적 인사이트 (Strategic Insights)
  {
    name: 'Y Combinator Blog',
    rssUrl: 'https://www.ycombinator.com/blog/rss',
    shortCode: 'YC',
    category: 'insights',
  },
  {
    name: 'First Round Review',
    rssUrl: 'https://review.firstround.com/feed.xml',
    shortCode: 'FR',
    category: 'insights',
  },
];

async function seedChannels() {
  console.log('🌱 Seeding channels...\n');
  const now = new Date().toISOString();

  for (const channel of channelData) {
    try {
      await db.insert(channels).values({
        id: uuidv4(),
        ...channel,
        isActive: true,
        fetchStatus: 'pending',
        createdAt: now,
        updatedAt: now,
      });
      console.log(`✅ Added: ${channel.name}`);
    } catch (error) {
      // 이미 존재하는 경우 스킵
      console.log(`⏭️  Skipped (already exists): ${channel.name}`);
    }
  }

  console.log('\n🎉 Seeding complete!');
  console.log(`Total channels: ${channelData.length}`);
}

seedChannels().catch(console.error);
