-- ============================================================
-- Seed data for The Bunker Indoor Golf (development / staging)
-- Placeholder business values are clearly marked and tracked in
-- LAUNCH_CHECKLIST.md.
-- ============================================================

-- ---------- Site settings ----------
insert into public.site_settings (key, value) values
  ('business_mode', '"fully_operational"'),
  ('opening_label', '"Fall 2026"'),
  ('facility', '{
    "name": "The Bunker Indoor Golf",
    "city": "Linton",
    "state": "IN",
    "address_line1": null,
    "postal_code": null,
    "phone": null,
    "email": "hello@thebunkerlinton.com",
    "timezone": "America/Indiana/Indianapolis"
  }'),
  ('hero', '{
    "eyebrow": "Coming to Linton, Indiana",
    "headline": "Indoor Golf.\nReal Connections.",
    "subheadline": "State-of-the-art simulators, leagues, lessons, good food and a place for our community to play, compete and connect—year-round."
  }'),
  ('simulator', '{
    "brand": null,
    "bay_count": 4,
    "course_count": null,
    "max_players_per_bay": 6,
    "club_rentals_available": true,
    "left_handed_support": true,
    "accessibility_notes": "At least one bay is planned to be fully wheelchair accessible."
  }'),
  ('booking_rules', '{
    "min_duration_minutes": 30,
    "max_duration_minutes": 240,
    "slot_interval_minutes": 30,
    "buffer_minutes": 10,
    "advance_window_days": 30,
    "same_day_cutoff_minutes": 60,
    "hold_minutes": 10,
    "cancellation_window_hours": 24,
    "tax_rate": 0.07
  }'),
  ('social', '{"facebook": null, "instagram": null}')
on conflict (key) do nothing;

-- ---------- Simulator bays ----------
insert into public.simulator_bays (name, slug, description, capacity, accessible, sort_order) values
  ('Bay 1 — St Andrews', 'bay-1', 'Corner bay with lounge seating for six.', 6, true, 1),
  ('Bay 2 — Pebble', 'bay-2', 'Center bay, ideal for foursomes.', 6, false, 2),
  ('Bay 3 — Augusta', 'bay-3', 'Center bay, ideal for foursomes.', 6, false, 3),
  ('Bay 4 — Whistling', 'bay-4', 'Semi-private end bay, great for lessons and small groups.', 4, false, 4)
on conflict (slug) do nothing;

-- ---------- Business hours (placeholder — confirm before launch) ----------
insert into public.business_hours (day_of_week, opens_at, closes_at) values
  (0, '12:00', '20:00'), -- Sunday
  (1, '09:00', '21:00'),
  (2, '09:00', '21:00'),
  (3, '09:00', '21:00'),
  (4, '09:00', '22:00'),
  (5, '09:00', '23:00'),
  (6, '09:00', '23:00');

-- ---------- Pricing rules (placeholder rates) ----------
insert into public.pricing_rules (name, service_type, day_of_week, starts_at, ends_at, price_per_unit_cents, billing_unit_minutes, priority) values
  ('Standard rate', 'bay_rental', null, null, null, 2000, 30, 0),
  ('Weekday off-peak (before 4pm)', 'bay_rental', 1, '09:00', '16:00', 1500, 30, 10),
  ('Weekday off-peak (before 4pm)', 'bay_rental', 2, '09:00', '16:00', 1500, 30, 10),
  ('Weekday off-peak (before 4pm)', 'bay_rental', 3, '09:00', '16:00', 1500, 30, 10),
  ('Weekday off-peak (before 4pm)', 'bay_rental', 4, '09:00', '16:00', 1500, 30, 10),
  ('Weekend peak', 'bay_rental', 5, '16:00', '23:00', 2500, 30, 10),
  ('Weekend peak', 'bay_rental', 6, '09:00', '23:00', 2500, 30, 10);

-- ---------- Membership plans (placeholder — final pricing TBD) ----------
insert into public.membership_plans (name, slug, description, billing_interval, price_cents, included_minutes, booking_window_days, discount_percentage, household_eligible, sort_order) values
  ('Practice', 'practice', 'For regulars who want consistent practice time each month.', 'month', 7900, 240, 10, 10, false, 1),
  ('Player', 'player', 'More included time, league discounts and priority tournament access.', 'month', 12900, 480, 14, 15, false, 2),
  ('Family', 'family', 'Shared household benefits with youth program discounts and guest privileges.', 'month', 17900, 600, 14, 15, true, 3),
  ('Business', 'business', 'Shared company credits, employee access and event discounts with central billing.', 'month', 24900, 900, 14, 15, true, 4)
on conflict (slug) do nothing;

-- ---------- Leagues ----------
insert into public.leagues (name, slug, category, description, season, day_of_week, start_time, capacity, team_size, price_cents, status) values
  ('Men''s Winter League', 'mens-winter-league', 'mens',
   'A friendly, competitive 8-week league played on championship courses. Two-player teams, weekly matchups and season standings.',
   'Winter 2026–27', 2, '18:00', 32, 2, 12000, 'interest'),
  ('Ladies'' League', 'ladies-league', 'ladies',
   'A welcoming league for women of all skill levels — equal parts golf, coaching tips and social time.',
   'Winter 2026–27', 3, '18:00', 24, 2, 12000, 'interest'),
  ('Couples League', 'couples-league', 'couples',
   'Team up with your favorite playing partner for a relaxed evening league with a social format.',
   'Winter 2026–27', 4, '19:00', 24, 2, 14000, 'interest'),
  ('Senior Day Play', 'senior-day-play', 'senior',
   'Daytime sessions for seniors with flexible formats, coffee and unhurried tee times.',
   'Ongoing', 3, '10:00', 16, 1, 6000, 'interest'),
  ('Business Team League', 'business-team-league', 'business',
   'Company vs. company team golf — a fun standing reason to get your team out of the office.',
   'Winter 2026–27', 1, '18:30', 24, 4, 32000, 'interest'),
  ('Church Team League', 'church-team-league', 'church',
   'Fellowship-first team league for area congregations. All skill levels welcome.',
   'Winter 2026–27', 4, '18:30', 24, 4, 28000, 'interest'),
  ('The Bunker Opening Tournament', 'opening-tournament', 'tournament',
   'Our inaugural tournament — a scramble format open to all, with prizes and plenty of fanfare.',
   'Fall 2026', null, null, 48, 4, 10000, 'opening_soon')
on conflict (slug) do nothing;

-- ---------- Instructors (placeholder) ----------
insert into public.instructors (display_name, bio, credentials, specialties, active) values
  ('Instruction Team', 'Our teaching staff will be announced closer to opening. Lessons will cover full swing, short game, putting and on-course strategy for all ages.', 'To be announced', array['full swing', 'short game', 'putting', 'beginners'], true);

-- ---------- Programs ----------
insert into public.programs (name, slug, category, description, skill_level, capacity, price_cents, duration_minutes, status, age_min, age_max) values
  ('Private Lesson', 'private-lesson', 'private_lesson',
   'One-on-one instruction tailored to your goals, using simulator ball-flight data to guide each session.',
   'all', 1, 6500, 60, 'interest', null, null),
  ('Beginner Basics', 'beginner-basics', 'beginner_lesson',
   'Never held a club? Perfect. A relaxed introduction to grip, stance and swing in a private bay.',
   'new', 4, 4500, 60, 'interest', null, null),
  ('Swing Evaluation', 'swing-evaluation', 'swing_evaluation',
   'A data-driven look at your swing with clear takeaways and a practice plan.',
   'all', 1, 5500, 45, 'interest', null, null),
  ('Junior Golf Clinic', 'junior-golf-clinic', 'youth_clinic',
   'Small-group clinics that make golf fun first — games, challenges and fundamentals for young golfers.',
   'all', 8, 9000, 60, 'interest', 7, 14),
  ('Junior League', 'junior-league', 'junior_league',
   'A team-based league for young golfers with weekly play and friendly coaching.',
   'all', 16, 11000, 90, 'interest', 10, 17)
on conflict (slug) do nothing;

-- ---------- Events ----------
insert into public.events (title, slug, category, excerpt, description, starts_at, ends_at, registration_required, status, featured) values
  ('Community Open House', 'community-open-house', 'community',
   'Walk the space, try a swing and meet Jay and Amanda before we officially open.',
   'Come see what we''ve been building. Tour the bays, watch simulator demos, ask questions about leagues and memberships, and enjoy light refreshments. Family friendly and free to attend.',
   '2026-09-19 15:00:00-04', '2026-09-19 20:00:00-04', false, 'published', true),
  ('Highland Stage Preview Night', 'highland-stage-preview-night', 'highland_stage',
   'A first look at our community stage with live acoustic music and an open lounge.',
   'The Highland Stage is our home for live entertainment and community programming. Join us for a preview evening with local musicians, drinks and a relaxed clubhouse atmosphere.',
   '2026-10-02 18:00:00-04', '2026-10-02 21:00:00-04', false, 'published', true),
  ('Simulator Demo Weekend', 'simulator-demo-weekend', 'golf',
   'Free 15-minute demo sessions all weekend — first come, first served.',
   'Curious how a golf simulator works? Drop in during demo weekend and our team will get you hitting shots on world-famous courses in minutes. All ages and skill levels welcome.',
   '2026-10-10 10:00:00-04', '2026-10-11 18:00:00-04', false, 'published', false)
on conflict (slug) do nothing;

-- ---------- Menu (placeholder items — replace with final menu) ----------
insert into public.menu_categories (name, slug, description, sort_order) values
  ('Shareables', 'shareables', 'Made for the whole bay.', 1),
  ('Snacks', 'snacks', 'Quick bites between shots.', 2),
  ('Sandwiches', 'sandwiches', 'Hearty enough for 18 holes.', 3),
  ('Kids', 'kids', 'For the junior members of your group.', 4),
  ('Desserts', 'desserts', 'Finish strong.', 5),
  ('Drinks', 'drinks', 'Sodas, coffee and more.', 6),
  ('Beer & Wine', 'beer-wine', 'Local favorites and clubhouse classics.', 7)
on conflict (slug) do nothing;

insert into public.menu_items (category_id, name, description, price_cents, dietary_labels, featured, sort_order)
select c.id, i.name, i.description, i.price_cents, i.dietary_labels, i.featured, i.sort_order
from (values
  ('shareables', 'Clubhouse Pretzel Bites', 'Warm pretzel bites with beer cheese and honey mustard.', 950, array['vegetarian'], true, 1),
  ('shareables', 'Loaded Bunker Nachos', 'Tortilla chips, queso, pico, jalapeños and your choice of chicken or pork.', 1250, array[]::text[], true, 2),
  ('shareables', 'Fairway Flatbread', 'Rotating flatbread with seasonal toppings — ask what''s on this week.', 1150, array[]::text[], false, 3),
  ('snacks', 'Kettle Chips & Dip', 'House kettle chips with French onion dip.', 550, array['vegetarian','gluten-conscious'], false, 1),
  ('snacks', 'Mixed Nuts', 'Roasted and lightly salted.', 450, array['vegan','gluten-conscious','contains-nuts'], false, 2),
  ('sandwiches', 'The Turn Club', 'Turkey, ham, bacon, lettuce, tomato and mayo on toasted sourdough.', 1150, array[]::text[], true, 1),
  ('sandwiches', 'Pulled Pork Sandwich', 'Slow-smoked pork with tangy slaw on a brioche bun.', 1150, array[]::text[], false, 2),
  ('kids', 'Chicken Tenders & Chips', 'Three crispy tenders with kettle chips.', 700, array[]::text[], false, 1),
  ('kids', 'Grilled Cheese', 'Classic grilled cheese on Texas toast.', 600, array['vegetarian'], false, 2),
  ('desserts', 'Warm Cookie Skillet', 'Chocolate chip cookie baked to order with vanilla ice cream.', 800, array['vegetarian','contains-nuts'], true, 1),
  ('drinks', 'Fountain Sodas', 'Coke products with free refills.', 300, array['vegan'], false, 1),
  ('drinks', 'Fresh Coffee', 'Locally roasted drip coffee.', 350, array['vegan'], false, 2),
  ('beer-wine', 'Local Draft Selection', 'Rotating Indiana craft drafts — ask what''s pouring.', 650, array[]::text[], false, 1),
  ('beer-wine', 'House Wine', 'Red or white by the glass.', 750, array[]::text[], false, 2)
) as i(category_slug, name, description, price_cents, dietary_labels, featured, sort_order)
join public.menu_categories c on c.slug = i.category_slug;

-- ---------- Waiver template ----------
insert into public.waiver_templates (name, version, content, active) values
  ('Facility Participation Waiver', 1,
   'PLACEHOLDER — This waiver text must be reviewed and approved by legal counsel before launch. It should cover assumption of risk for simulator use, equipment handling, facility rules, and parental/guardian consent for minors.',
   true);

-- ---------- Opening updates ----------
insert into public.opening_updates (title, slug, excerpt, content, status, published_at) values
  ('The Bunker is Coming to Linton', 'the-bunker-is-coming-to-linton',
   'Jay and Amanda are bringing year-round indoor golf to Greene County — opening Fall 2026.',
   'We''re thrilled to officially announce The Bunker Indoor Golf, opening in Linton in Fall 2026. Our vision is simple: a year-round place to play, learn, compete and connect — whether you''ve played golf your whole life or you''ve never picked up a club.

The Bunker will feature state-of-the-art simulator bays, a putting green, private lessons, leagues for every kind of player, youth programs and a comfortable lounge with food and drinks.

Follow along here for construction updates, league announcements and your first chance to book a bay.',
   'published', '2026-06-01 09:00:00-04'),
  ('Construction Underway', 'construction-underway',
   'Walls are going up and bay layouts are locked in. Here''s a look at the progress.',
   'Construction is officially underway. This month the crew finished demo and framing for the simulator bays, the Highland Stage corner and the lounge. Next up: electrical, screens and turf.

Want to be first to know when league registration and bay reservations open? Join the opening list and pick the programs you''re interested in.',
   'published', '2026-07-01 09:00:00-04')
on conflict (slug) do nothing;
