import { supabase } from '@/integrations/supabase/client';

// Sample data constants
const SAMPLE_CATEGORIES = [
  { name: 'Family', slug: 'family' },
  { name: 'Friends', slug: 'friends' },
  { name: 'Work', slug: 'work' },
  { name: 'Community', slug: 'community' },
  { name: 'Other', slug: 'other' }
];

const SAMPLE_PEOPLE = [
  { display_name: 'Alex', aliases: ['Alexander', 'Al'], category_slug: 'family' },
  { display_name: 'Jamie', aliases: ['James', 'Jay'], category_slug: 'friends' },
  { display_name: 'Maya', aliases: ['May', 'M'], category_slug: 'work' },
  { display_name: 'Lee', aliases: ['L'], category_slug: 'work' },
  { display_name: 'Sam', aliases: ['Samuel', 'Sammy'], category_slug: 'friends' },
  { display_name: 'John D.', aliases: ['JD', 'John'], category_slug: 'community' },
  { display_name: 'Jon D.', aliases: ['JD', 'Jonathan'], category_slug: 'community' }
];

const SAMPLE_GROUPS = [
  { name: 'Colleagues', emoji: '👩‍💻' },
  { name: 'Neighbors', emoji: '🏡' }
];

const SAMPLE_DESCRIPTIONS = [
  "Brought coffee to a teammate",
  "Helped neighbor carry groceries", 
  "Sent a thank-you email",
  "Visited a friend who was sick",
  "Wrote a kind note",
  "Helped debug an issue",
  "Joined community clean-up",
  "Called family to check in",
  "Shared helpful resources",
  "Offered encouragement during tough time",
  "Celebrated a colleague's success",
  "Volunteered at local event",
  "Made dinner for new parents",
  "Listened when someone needed to talk",
  "Gave constructive feedback",
  "Helped with moving day"
];

const SAMPLE_TAGS = ['gratitude', 'help', 'visit', 'coffee', 'email', 'note', 'kindness', 'daily'];

// Helper to get random items from array
const getRandomItems = <T>(array: T[], count: number): T[] => {
  const shuffled = [...array].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
};

// Helper to generate random date in past 120 days
const getRandomDate = (daysBack: number = 120): Date => {
  const now = new Date();
  const randomDays = Math.random() * daysBack;
  const randomHours = Math.random() * 24;
  const date = new Date(now.getTime() - (randomDays * 24 * 60 * 60 * 1000));
  date.setHours(randomHours);
  return date;
};

export const seedSampleData = async () => {
  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const userId = user.id;

  try {
    // 1. Ensure default categories exist
    console.log('Creating categories...');
    const categoryMap = new Map<string, string>();
    
    for (const cat of SAMPLE_CATEGORIES) {
      const { data: existing } = await supabase
        .from('categories')
        .select('id')
        .eq('user_id', userId)
        .eq('slug', cat.slug)
        .single();

      if (existing) {
        categoryMap.set(cat.slug, existing.id);
      } else {
        const { data: created } = await supabase
          .from('categories')
          .insert({
            user_id: userId,
            name: cat.name,
            slug: cat.slug,
            is_default: true,
            sort_order: SAMPLE_CATEGORIES.indexOf(cat) + 1
          })
          .select('id')
          .single();

        if (created) {
          categoryMap.set(cat.slug, created.id);
        }
      }
    }

    // 2. Create people
    console.log('Creating people...');
    const peopleIds: string[] = [];
    
    for (const person of SAMPLE_PEOPLE) {
      const defaultCategoryId = categoryMap.get(person.category_slug);
      
      const { data: created } = await supabase
        .from('people')
        .insert({
          user_id: userId,
          display_name: person.display_name,
          aliases: person.aliases,
          default_category_id: defaultCategoryId
        })
        .select('id')
        .single();

      if (created) {
        peopleIds.push(created.id);
      }
    }

    // 3. Create groups
    console.log('Creating groups...');
    const groupIds: string[] = [];
    
    for (const group of SAMPLE_GROUPS) {
      const { data: created } = await supabase
        .from('groups')
        .insert({
          user_id: userId,
          name: group.name,
          emoji: group.emoji,
          sort_order: SAMPLE_GROUPS.indexOf(group) + 1
        })
        .select('id')
        .single();

      if (created) {
        groupIds.push(created.id);
      }
    }

    // 4. Assign people to groups (random assignment)
    console.log('Assigning people to groups...');
    const assignments: Array<{ person_id: string; group_id: string }> = [];
    
    // Assign some people to Colleagues group
    const colleaguesGroup = groupIds[0];
    const workPeople = peopleIds.slice(2, 5); // Maya, Lee, Sam
    workPeople.forEach(personId => {
      assignments.push({ person_id: personId, group_id: colleaguesGroup });
    });

    // Assign some people to Neighbors group  
    const neighborsGroup = groupIds[1];
    const neighborPeople = getRandomItems(peopleIds, 3);
    neighborPeople.forEach(personId => {
      assignments.push({ person_id: personId, group_id: neighborsGroup });
    });

    if (assignments.length > 0) {
      await supabase
        .from('person_groups')
        .insert(assignments);
    }

    // 5. Create moments (60+ across 120 days)
    console.log('Creating moments...');
    const moments: Array<any> = [];
    const categoryIds = Array.from(categoryMap.values());
    
    for (let i = 0; i < 65; i++) {
      const isSignificant = Math.random() < 0.2; // 20% significant
      const hasPersonId = Math.random() < 0.85; // 85% have person assigned
      const action = Math.random() < 0.5 ? 'given' : 'received';
      
      moments.push({
        user_id: userId,
        description: SAMPLE_DESCRIPTIONS[Math.floor(Math.random() * SAMPLE_DESCRIPTIONS.length)],
        action,
        happened_at: getRandomDate().toISOString(),
        person_id: hasPersonId ? peopleIds[Math.floor(Math.random() * peopleIds.length)] : null,
        category_id: categoryIds[Math.floor(Math.random() * categoryIds.length)],
        significance: isSignificant,
        tags: getRandomItems(SAMPLE_TAGS, Math.floor(Math.random() * 3) + 1),
        source: 'text'
      });
    }

    // Insert moments in batches to avoid rate limits
    const batchSize = 10;
    for (let i = 0; i < moments.length; i += batchSize) {
      const batch = moments.slice(i, i + batchSize);
      await supabase.from('moments').insert(batch);
      
      // Small delay between batches
      if (i + batchSize < moments.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    console.log('Sample data seeded successfully');

  } catch (error) {
    console.error('Error seeding sample data:', error);
    throw error;
  }
};

export const seedStreakDemo = async () => {
  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const userId = user.id;

  try {
    console.log('Creating streak demo data...');

    // Ensure we have categories and people
    const categoryMap = new Map<string, string>();
    
    for (const cat of SAMPLE_CATEGORIES.slice(0, 3)) { // Just first 3 categories
      const { data: existing } = await supabase
        .from('categories')
        .select('id')
        .eq('user_id', userId)
        .eq('slug', cat.slug)
        .maybeSingle();

      if (existing) {
        categoryMap.set(cat.slug, existing.id);
      } else {
        const { data: created } = await supabase
          .from('categories')
          .insert({
            user_id: userId,
            name: cat.name,
            slug: cat.slug,
            is_default: true,
            sort_order: SAMPLE_CATEGORIES.indexOf(cat) + 1
          })
          .select('id')
          .single();

        if (created) {
          categoryMap.set(cat.slug, created.id);
        }
      }
    }

    // Create 3 people for variety
    const streakPeople = SAMPLE_PEOPLE.slice(0, 3);
    const peopleIds: string[] = [];
    
    for (const person of streakPeople) {
      const defaultCategoryId = categoryMap.get(person.category_slug);
      
      const { data: created } = await supabase
        .from('people')
        .insert({
          user_id: userId,
          display_name: person.display_name,
          aliases: person.aliases,
          default_category_id: defaultCategoryId
        })
        .select('id')
        .single();

      if (created) {
        peopleIds.push(created.id);
      }
    }

    const categoryIds = Array.from(categoryMap.values());
    const moments: Array<any> = [];
    const now = new Date();
    
    // Pattern: 12 consecutive days with 1-3 moments each, then 1-day gap, then 3 sparse days
    
    // 12 consecutive days (starting 16 days ago to include the gap and sparse days)
    for (let dayOffset = 16; dayOffset >= 5; dayOffset--) {
      const momentsThisDay = Math.floor(Math.random() * 3) + 1; // 1-3 moments
      
      for (let momentIndex = 0; momentIndex < momentsThisDay; momentIndex++) {
        const momentDate = new Date(now);
        momentDate.setDate(momentDate.getDate() - dayOffset);
        momentDate.setHours(8 + Math.floor(Math.random() * 12)); // 8 AM to 8 PM
        momentDate.setMinutes(Math.floor(Math.random() * 60));
        
        moments.push({
          user_id: userId,
          description: SAMPLE_DESCRIPTIONS[Math.floor(Math.random() * SAMPLE_DESCRIPTIONS.length)],
          action: 'given', // All given for streak demo
          happened_at: momentDate.toISOString(),
          person_id: peopleIds[Math.floor(Math.random() * peopleIds.length)],
          category_id: categoryIds[Math.floor(Math.random() * categoryIds.length)],
          significance: Math.random() < 0.15, // 15% significant
          tags: getRandomItems(SAMPLE_TAGS, Math.floor(Math.random() * 2) + 1),
          source: 'text'
        });
      }
    }
    
    // Day 4 is the gap (no moments)
    
    // 3 sparse days (days 3, 2, 1 ago) - only 1 moment each, random chance
    for (let dayOffset = 3; dayOffset >= 1; dayOffset--) {
      if (Math.random() < 0.7) { // 70% chance for a moment on sparse days
        const momentDate = new Date(now);
        momentDate.setDate(momentDate.getDate() - dayOffset);
        momentDate.setHours(10 + Math.floor(Math.random() * 8)); // 10 AM to 6 PM
        momentDate.setMinutes(Math.floor(Math.random() * 60));
        
        moments.push({
          user_id: userId,
          description: SAMPLE_DESCRIPTIONS[Math.floor(Math.random() * SAMPLE_DESCRIPTIONS.length)],
          action: Math.random() < 0.7 ? 'given' : 'received', // Mostly given
          happened_at: momentDate.toISOString(),
          person_id: peopleIds[Math.floor(Math.random() * peopleIds.length)],
          category_id: categoryIds[Math.floor(Math.random() * categoryIds.length)],
          significance: Math.random() < 0.1,
          tags: getRandomItems(SAMPLE_TAGS, 1),
          source: 'text'
        });
      }
    }

    // Insert moments in batches
    console.log(`Creating ${moments.length} moments for streak demo...`);
    const batchSize = 10;
    for (let i = 0; i < moments.length; i += batchSize) {
      const batch = moments.slice(i, i + batchSize);
      await supabase.from('moments').insert(batch);
      
      if (i + batchSize < moments.length) {
        await new Promise(resolve => setTimeout(resolve, 50));
      }
    }

    console.log('Streak demo data created successfully');

  } catch (error) {
    console.error('Error creating streak demo:', error);
    throw error;
  }
};

export const clearSampleData = async () => {
  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const userId = user.id;

  try {
    console.log('Clearing sample data...');

    // Delete in order to respect foreign key constraints
    // 1. Delete moments
    await supabase
      .from('moments')
      .delete()
      .eq('user_id', userId);

    // 2. Delete person_groups
    const { data: userPeople } = await supabase
      .from('people')
      .select('id')
      .eq('user_id', userId);
    
    if (userPeople && userPeople.length > 0) {
      const personIds = userPeople.map(p => p.id);
      await supabase
        .from('person_groups')
        .delete()
        .in('person_id', personIds);
    }

    // 3. Delete groups
    await supabase
      .from('groups')
      .delete()
      .eq('user_id', userId);

    // 4. Delete people
    await supabase
      .from('people')
      .delete()
      .eq('user_id', userId);

    console.log('Sample data cleared successfully');

  } catch (error) {
    console.error('Error clearing sample data:', error);
    throw error;
  }
};