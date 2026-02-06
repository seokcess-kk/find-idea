import { db } from './index';
import { channels } from './schema';
import { v4 as uuidv4 } from 'uuid';

const now = new Date().toISOString();

const initialChannels = [
  // 직접적 니즈 표현 (Direct Needs)
  {
    id: uuidv4(),
    name: 'r/SomebodyMakeThis',
    rssUrl: 'https://www.reddit.com/r/SomebodyMakeThis/new/.rss',
    shortCode: 'SMT',
    category: 'direct_needs',
  },
  {
    id: uuidv4(),
    name: 'r/AppIdeas',
    rssUrl: 'https://www.reddit.com/r/AppIdeas/new/.rss',
    shortCode: 'APP',
    category: 'direct_needs',
  },
  {
    id: uuidv4(),
    name: 'Ask HN',
    rssUrl: 'https://hnrss.org/ask',
    shortCode: 'AHN',
    category: 'direct_needs',
  },
  // 트렌드/경쟁 분석 (Trends)
  {
    id: uuidv4(),
    name: 'Product Hunt',
    rssUrl: 'https://www.producthunt.com/feed',
    shortCode: 'PH',
    category: 'trends',
  },
  {
    id: uuidv4(),
    name: 'BetaList',
    rssUrl: 'https://betalist.com/feed',
    shortCode: 'BL',
    category: 'trends',
  },
  {
    id: uuidv4(),
    name: 'Show HN',
    rssUrl: 'https://hnrss.org/show',
    shortCode: 'SHN',
    category: 'trends',
  },
  // 빌더 커뮤니티 (Builders)
  {
    id: uuidv4(),
    name: 'r/startups',
    rssUrl: 'https://www.reddit.com/r/startups/new/.rss',
    shortCode: 'SU',
    category: 'builders',
  },
  {
    id: uuidv4(),
    name: 'r/Entrepreneur',
    rssUrl: 'https://www.reddit.com/r/Entrepreneur/new/.rss',
    shortCode: 'ENT',
    category: 'builders',
  },
  {
    id: uuidv4(),
    name: 'r/SaaS',
    rssUrl: 'https://www.reddit.com/r/SaaS/new/.rss',
    shortCode: 'SAAS',
    category: 'builders',
  },
  {
    id: uuidv4(),
    name: 'r/SideProject',
    rssUrl: 'https://www.reddit.com/r/SideProject/new/.rss',
    shortCode: 'SP',
    category: 'builders',
  },
  {
    id: uuidv4(),
    name: 'Indie Hackers',
    rssUrl: 'https://www.indiehackers.com/feed.xml',
    shortCode: 'IH',
    category: 'builders',
  },
  // 전략적 인사이트 (Insights)
  {
    id: uuidv4(),
    name: 'Y Combinator Blog',
    rssUrl: 'https://www.ycombinator.com/blog/rss',
    shortCode: 'YC',
    category: 'insights',
  },
  {
    id: uuidv4(),
    name: 'First Round Review',
    rssUrl: 'https://review.firstround.com/feed.xml',
    shortCode: 'FR',
    category: 'insights',
  },
];

async function seed() {
  console.log('Seeding database...');

  // 채널 데이터 삽입
  for (const channel of initialChannels) {
    try {
      await db.insert(channels).values({
        ...channel,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      });
      console.log(`  ✓ Added channel: ${channel.name}`);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      if (errorMessage.includes('UNIQUE constraint')) {
        console.log(`  - Skipped (exists): ${channel.name}`);
      } else {
        console.error(`  ✗ Failed: ${channel.name}`, errorMessage);
      }
    }
  }

  console.log('Seeding completed!');
}

seed().catch(console.error);
