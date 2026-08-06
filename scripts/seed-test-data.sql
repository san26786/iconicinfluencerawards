-- Seed test data for London Business Awards (site_id = 1)
-- Run: psql $DATABASE_URL -f scripts/seed-test-data.sql

-- ─── CLEAN SLATE ──────────────────────────────────────────────────────────
DELETE FROM judge_scores;
DELETE FROM judge_applicants;
DELETE FROM judge_categories WHERE site_id = 1;
DELETE FROM award_categories WHERE site_id = 1;
DELETE FROM nominations WHERE site_id = 1;
DELETE FROM judges WHERE site_id = 1;

-- ─── JUDGES ────────────────────────────────────────────────────────────────
INSERT INTO judges (site_id, first_name, last_name, email, phone, company, job_title, bio, expertise, linkedin, status, agreed_to_terms, applied_at, approved_at) VALUES
  (1,'Sarah','Mitchell','sarah.mitchell@example.com','+44 7700 900001','Mitchell Ventures','CEO',
   'Sarah has led Mitchell Ventures for 12 years, scaling it from a startup to 200 employees. Passionate about supporting SMEs.',
   'Business Strategy & Growth','https://linkedin.com/in/sarahmitchell','approved',true, NOW()-'30 days'::interval, NOW()-'25 days'::interval),
  (1,'James','Thornton','james.thornton@example.com','+44 7700 900002','Thornton Digital','Managing Director',
   '15 years of digital transformation across fintech and retail. Has judged three national business awards.',
   'Digital Transformation','https://linkedin.com/in/jamesthornton','approved',true, NOW()-'28 days'::interval, NOW()-'23 days'::interval),
  (1,'Priya','Sharma','priya.sharma@example.com','+44 7700 900003','Sharma Consulting','Partner',
   'Chartered accountant and business consultant specialising in scaling operations for FTSE 250 clients.',
   'Finance & Operations','https://linkedin.com/in/priyasharma','approved',true, NOW()-'26 days'::interval, NOW()-'21 days'::interval),
  (1,'Oliver','Bennett','oliver.bennett@example.com','+44 7700 900004','Bennett & Co','Founder',
   'Founded one of London''s leading marketing agencies in 2010. Champions creative excellence and brand-led growth.',
   'Marketing & Brand Strategy','https://linkedin.com/in/oliverbennett','approved',true, NOW()-'25 days'::interval, NOW()-'20 days'::interval),
  (1,'Fatima','Al-Hassan','fatima.alhassan@example.com','+44 7700 900005','Horizon Tech','CTO',
   'Software engineer turned executive who built and exited two tech startups. Focused on AI ethics.',
   'Technology & AI','https://linkedin.com/in/fatimaalhassan','approved',true, NOW()-'24 days'::interval, NOW()-'19 days'::interval),
  (1,'David','Okafor','david.okafor@example.com','+44 7700 900006','London Chamber','Director',
   'Two decades in the London business community, fostering trade and supporting local entrepreneurs.',
   'SME Development & Trade','https://linkedin.com/in/davidokafor','approved',true, NOW()-'22 days'::interval, NOW()-'17 days'::interval),
  (1,'Amelia','Clarke','amelia.clarke@example.com','+44 7700 900007','GreenPath Ltd','CEO',
   'Leads GreenPath, a sustainability consultancy helping 300+ businesses reduce their carbon footprint.',
   'Sustainability & ESG','https://linkedin.com/in/ameliaclarke','approved',true, NOW()-'20 days'::interval, NOW()-'15 days'::interval),
  (1,'Rajiv','Patel','rajiv.patel@example.com','+44 7700 900008','Patel Capital','Investment Director',
   'Oversees a £200m portfolio of early-stage investments. Has sat on 18 company boards.',
   'Investment & Venture Capital','https://linkedin.com/in/rajivpatel','approved',true, NOW()-'18 days'::interval, NOW()-'13 days'::interval),
  (1,'Sophie','Lawson','sophie.lawson@example.com','+44 7700 900009','Lawson HR','Founder & CEO',
   'Founded Lawson HR to build cultures where people thrive. Keynote speaker and author on workplace wellbeing.',
   'HR, Culture & Wellbeing','https://linkedin.com/in/sophielawson','approved',true, NOW()-'16 days'::interval, NOW()-'11 days'::interval),
  (1,'Marcus','Webb','marcus.webb@example.com','+44 7700 900010','Webb Export','Managing Partner',
   'Built an international trade network spanning 40 countries. Specialises in helping UK businesses export.',
   'International Trade & Export','https://linkedin.com/in/marcuswebb','approved',true, NOW()-'14 days'::interval, NOW()-'9 days'::interval),
  (1,'Chloe','Nguyen','chloe.nguyen@example.com','+44 7700 900011','Nguyen Studios','Creative Director',
   'Award-winning creative director with experience across fashion, advertising and digital media.',
   'Creative & Design',NULL,'pending',true, NOW()-'5 days'::interval, NULL),
  (1,'Tom','Griffiths','tom.griffiths@example.com','+44 7700 900012','Griffiths Law','Senior Partner',
   'Commercial solicitor with 20 years of experience in M&A and corporate law.',
   'Legal & Compliance',NULL,'pending',true, NOW()-'4 days'::interval, NULL),
  (1,'Ayesha','Khan','ayesha.khan@example.com','+44 7700 900013','KhanMedia','Editor-in-Chief',
   'Led editorial teams at three national business publications. Champions diverse voices in media.',
   'Media & Journalism',NULL,'pending',true, NOW()-'3 days'::interval, NULL),
  (1,'Ben','Foster','ben.foster@example.com','+44 7700 900014','Foster Logistics','Operations Director',
   'Oversees supply chain operations for a multi-site logistics firm with 500 staff.',
   'Logistics & Supply Chain',NULL,'pending',true, NOW()-'3 days'::interval, NULL),
  (1,'Natalie','Cross','natalie.cross@example.com','+44 7700 900015','Cross Retail','Head of Retail',
   'Driven retail strategy for brands across the UK and Europe.',
   'Retail & E-commerce',NULL,'pending',true, NOW()-'2 days'::interval, NULL),
  (1,'George','Adeyemi','george.adeyemi@example.com','+44 7700 900016','Adeyemi Group','Chairman',
   'Chairs a diversified business group with interests in property, hospitality and finance.',
   'Property & Hospitality',NULL,'pending',true, NOW()-'2 days'::interval, NULL),
  (1,'Lisa','Hartley','lisa.hartley@example.com','+44 7700 900017','Hartley Health','Clinical Director',
   'Runs a group of private healthcare clinics. Champion of health innovation.',
   'Healthcare & Wellbeing',NULL,'pending',true, NOW()-'1 day'::interval, NULL),
  (1,'Paul','Simmons','paul.simmons@example.com','+44 7700 900018','Self Employed','Consultant',
   'Independent business consultant with a general background in SME advisory.',
   'General Business',NULL,'rejected',true, NOW()-'20 days'::interval, NULL),
  (1,'Karen','Hughes','karen.hughes@example.com','+44 7700 900019','Hughes Events','Event Manager',
   'Manages corporate events and conferences across London.',
   'Events & Hospitality',NULL,'rejected',true, NOW()-'18 days'::interval, NULL),
  (1,'Derek','Stone','derek.stone@example.com','+44 7700 900020','Stone Co','Director',
   'Runs a small manufacturing company in East London.',
   'Manufacturing',NULL,'rejected',true, NOW()-'15 days'::interval, NULL);

-- ─── NOMINATIONS ──────────────────────────────────────────────────────────
INSERT INTO nominations (site_id, site, nominee_first_name, nominee_last_name, nominee_email, nominee_mobile, business_name, business_location, award_categories, opening_statement, agreed_to_terms, submitted_at, created_at) VALUES
  (1,'londonbusinessawards.com','Emma','Roberts','emma.roberts@techrise.co.uk','+44 7800 100001','TechRise Ltd','London',
   '["Business of the Year","Innovation Award"]'::jsonb,
   'TechRise has grown 300% in 3 years building AI-powered tools for the NHS, saving clinicians thousands of hours.',true,NOW()-'60 days'::interval,NOW()-'60 days'::interval),
  (1,'londonbusinessawards.com','Liam','Johnson','liam.johnson@greencore.co.uk','+44 7800 100002','GreenCore Energy','London',
   '["Innovation Award","Sustainability Award"]'::jsonb,
   'GreenCore developed battery technology that extends EV range by 40%, now licensed to three manufacturers.',true,NOW()-'58 days'::interval,NOW()-'58 days'::interval),
  (1,'londonbusinessawards.com','Aisha','Williams','aisha.w@bloombakery.co.uk','+44 7800 100003','Bloom Bakery','London',
   '["Small Business of the Year","Customer Service Excellence"]'::jsonb,
   'Started as a one-woman kitchen and now employs 25 people across four London locations.',true,NOW()-'55 days'::interval,NOW()-'55 days'::interval),
  (1,'londonbusinessawards.com','Noah','Brown','noah.brown@buildright.co.uk','+44 7800 100004','BuildRight Construction','London',
   '["Employer of the Year","Business of the Year"]'::jsonb,
   'Achieved 97% employee retention with a 4-day work week and profit-sharing scheme across 120 staff.',true,NOW()-'53 days'::interval,NOW()-'53 days'::interval),
  (1,'londonbusinessawards.com','Isabella','Jones','ij@fashionforward.co.uk','+44 7800 100005','Fashion Forward','London',
   '["Entrepreneur of the Year","Innovation Award"]'::jsonb,
   'Launched at 24, disrupted fast fashion with zero-waste production. Now stocking in 200 retailers worldwide.',true,NOW()-'51 days'::interval,NOW()-'51 days'::interval),
  (1,'londonbusinessawards.com','William','Davis','wdavis@capitalfin.co.uk','+44 7800 100006','Capital Finance Group','London',
   '["Business of the Year","Sustainability Award"]'::jsonb,
   'First London lender to achieve net-zero by integrating ESG scoring into every lending decision.',true,NOW()-'49 days'::interval,NOW()-'49 days'::interval),
  (1,'londonbusinessawards.com','Sofia','Miller','sofia@mealkit.co.uk','+44 7800 100007','FreshBox Meals','London',
   '["Small Business of the Year","Customer Service Excellence"]'::jsonb,
   'Born in lockdown, now delivers 10,000 meal kits weekly with a 4.9-star rating and 82% retention.',true,NOW()-'47 days'::interval,NOW()-'47 days'::interval),
  (1,'londonbusinessawards.com','James','Wilson','jwilson@urbanfit.co.uk','+44 7800 100008','UrbanFit Gyms','London',
   '["Employer of the Year","Customer Service Excellence"]'::jsonb,
   'London''s most inclusive gym brand three years running, removing all barriers for low-income communities.',true,NOW()-'45 days'::interval,NOW()-'45 days'::interval),
  (1,'londonbusinessawards.com','Charlotte','Moore','cmoore@skyarchitects.co.uk','+44 7800 100009','Sky Architects','London',
   '["Innovation Award","Sustainability Award"]'::jsonb,
   'Pioneered living building design in London — structures that generate more energy than they consume.',true,NOW()-'43 days'::interval,NOW()-'43 days'::interval),
  (1,'londonbusinessawards.com','Oliver','Taylor','otaylor@logiqr.co.uk','+44 7800 100010','LogiQR Solutions','London',
   '["Business of the Year","Innovation Award"]'::jsonb,
   'QR-based inventory system cut warehouse errors by 94% for 500 clients. UK''s fastest-growing supply chain tech.',true,NOW()-'41 days'::interval,NOW()-'41 days'::interval),
  (1,'londonbusinessawards.com','Ava','Anderson','aanderson@nurseplus.co.uk','+44 7800 100011','NursePlus','London',
   '["Entrepreneur of the Year","Employer of the Year"]'::jsonb,
   'Built NursePlus into a £50m healthcare staffing business in 7 years, championing fair pay for nurses.',true,NOW()-'39 days'::interval,NOW()-'39 days'::interval),
  (1,'londonbusinessawards.com','Harry','Thomas','harry@edgelearn.co.uk','+44 7800 100012','EdgeLearn Academy','London',
   '["Small Business of the Year","Innovation Award"]'::jsonb,
   'Free coding bootcamps for unemployed Londoners, with a 78% employment rate for graduates within 6 months.',true,NOW()-'37 days'::interval,NOW()-'37 days'::interval),
  (1,'londonbusinessawards.com','Mia','Jackson','mia.j@petalpetal.co.uk','+44 7800 100013','Petal & Co','London',
   '["Small Business of the Year","Customer Service Excellence"]'::jsonb,
   'Redefined floristry through subscription boxes and AI personalisation, winning RHS startup of the year.',true,NOW()-'35 days'::interval,NOW()-'35 days'::interval),
  (1,'londonbusinessawards.com','Ethan','White','ewhite@dronedel.co.uk','+44 7800 100014','DroneDeliver UK','London',
   '["Innovation Award","Business of the Year"]'::jsonb,
   'UK''s first commercially licensed drone delivery service, cutting last-mile costs by 60%.',true,NOW()-'33 days'::interval,NOW()-'33 days'::interval),
  (1,'londonbusinessawards.com','Amelia','Harris','a.harris@solarsmart.co.uk','+44 7800 100015','SolarSmart','London',
   '["Sustainability Award","Entrepreneur of the Year"]'::jsonb,
   'Bootstrapped from a garage, now installs solar panels for 1,000 London households per year below market rate.',true,NOW()-'31 days'::interval,NOW()-'31 days'::interval),
  (1,'londonbusinessawards.com','Lucas','Martin','lucas@marketforge.co.uk','+44 7800 100016','MarketForge','London',
   '["Business of the Year","Employer of the Year"]'::jsonb,
   'B2B marketplace connecting 5,000 UK suppliers with international buyers, generating £200m in trade.',true,NOW()-'29 days'::interval,NOW()-'29 days'::interval),
  (1,'londonbusinessawards.com','Grace','Garcia','grace@citylaw.co.uk','+44 7800 100017','City Legal Services','London',
   '["Customer Service Excellence","Entrepreneur of the Year"]'::jsonb,
   'Low-cost legal clinic for small businesses, earning 99% satisfaction from 2,000 clients in year one.',true,NOW()-'27 days'::interval,NOW()-'27 days'::interval),
  (1,'londonbusinessawards.com','Henry','Martinez','hm@bristolbrew.co.uk','+44 7800 100018','Capital Brew Co','London',
   '["Small Business of the Year","Sustainability Award"]'::jsonb,
   '100% recycled materials, 5% of profits to urban greening. Three sustainability certifications.',true,NOW()-'25 days'::interval,NOW()-'25 days'::interval),
  (1,'londonbusinessawards.com','Lily','Robinson','lily.r@datawise.co.uk','+44 7800 100019','DataWise Analytics','London',
   '["Innovation Award","Business of the Year"]'::jsonb,
   'Predictive analytics saving NHS trusts £15m in procurement by identifying supply chain inefficiencies.',true,NOW()-'23 days'::interval,NOW()-'23 days'::interval),
  (1,'londonbusinessawards.com','Jack','Clark','jack@speedship.co.uk','+44 7800 100020','SpeedShip Logistics','London',
   '["Employer of the Year","Customer Service Excellence"]'::jsonb,
   '100% on-time delivery for 18 consecutive months. Ranked UK top logistics employer by Glassdoor.',true,NOW()-'21 days'::interval,NOW()-'21 days'::interval);

-- ─── AWARD CATEGORIES (sync from nominations) ─────────────────────────────
INSERT INTO award_categories (site_id, category_id, category_name, nominations_count, applications_count, judges_count)
SELECT
  1, cat, cat,
  COUNT(*)::int,
  COUNT(*)::int,
  0
FROM nominations n, jsonb_array_elements_text(n.award_categories) AS cat
WHERE n.site_id = 1 AND n.award_categories IS NOT NULL
GROUP BY cat
ON CONFLICT ON CONSTRAINT award_categories_site_category_unique DO UPDATE
  SET nominations_count = EXCLUDED.nominations_count,
      applications_count = EXCLUDED.applications_count;

-- ─── JUDGE–CATEGORY ALLOCATIONS ──────────────────────────────────────────
-- Assign 2 categories per approved judge
INSERT INTO judge_categories (site_id, judge_id, category_id)
SELECT 1, j.id, c.category_id
FROM (
  SELECT id, row_number() OVER (ORDER BY id) AS rn FROM judges WHERE site_id=1 AND status='approved'
) j
JOIN (
  SELECT category_id, row_number() OVER (ORDER BY category_id) AS rn,
         COUNT(*) OVER () AS total FROM award_categories WHERE site_id=1
) c ON c.rn IN ( ((j.rn - 1) % (SELECT COUNT(*)::int FROM award_categories WHERE site_id=1)) + 1,
                  (j.rn       % (SELECT COUNT(*)::int FROM award_categories WHERE site_id=1)) + 1 )
ON CONFLICT (judge_id, category_id) DO NOTHING;

-- Update judges_count in award_categories
UPDATE award_categories ac
SET judges_count = (
  SELECT COUNT(*) FROM judge_categories jc WHERE jc.site_id=1 AND jc.category_id=ac.category_id
)
WHERE ac.site_id=1;

-- ─── JUDGE–APPLICANT ALLOCATIONS ──────────────────────────────────────────
-- Assign 2 approved judges to each nomination
INSERT INTO judge_applicants (judge_id, nomination_id, site_id)
SELECT j.id, n.id, 1
FROM (SELECT id, row_number() OVER (ORDER BY id) AS rn FROM judges WHERE site_id=1 AND status='approved') j
CROSS JOIN (SELECT id, row_number() OVER (ORDER BY id) AS rn FROM nominations WHERE site_id=1) n
WHERE j.rn IN (((n.rn - 1) % 10) + 1, (n.rn % 10) + 1);

-- ─── JUDGE SCORES (first 15 nominations, 2 judges each) ──────────────────
INSERT INTO judge_scores (judge_id, nomination_id, site_id, score, notes, marked_first, marked_semifinalist, marked_finalist, scored_at)
SELECT
  ja.judge_id,
  ja.nomination_id,
  1,
  5 + ((ja.judge_id * 3 + ja.nomination_id * 7) % 6) AS score,
  'Strong application with clear impact metrics. Well-structured and evidence-based.' AS notes,
  false, false, false,
  NOW() - ((20 - (ja.nomination_id % 20)) * '1 day'::interval)
FROM judge_applicants ja
JOIN nominations n ON n.id = ja.nomination_id
WHERE n.site_id = 1
  AND n.id IN (SELECT id FROM nominations WHERE site_id=1 ORDER BY id LIMIT 15)
ON CONFLICT (judge_id, nomination_id) DO NOTHING;

-- ─── UPDATE AVG SCORES ────────────────────────────────────────────────────
UPDATE nominations n
SET avg_score = (
  SELECT ROUND(AVG(score)::numeric, 2)
  FROM judge_scores js WHERE js.nomination_id = n.id
)
WHERE n.site_id = 1;

-- ─── MARK SHORTLISTED / FINALIST ─────────────────────────────────────────
WITH ranked AS (
  SELECT id, row_number() OVER (ORDER BY avg_score DESC NULLS LAST) AS rn
  FROM nominations WHERE site_id=1
)
UPDATE nominations n
SET
  is_shortlisted  = (r.rn <= 8),
  is_semifinalist = (r.rn <= 4),
  is_finalist     = (r.rn <= 2)
FROM ranked r WHERE r.id = n.id;

-- ─── SUMMARY ──────────────────────────────────────────────────────────────
SELECT 'judges'           AS table_name, COUNT(*) FROM judges WHERE site_id=1
UNION ALL SELECT 'approved',             COUNT(*) FROM judges WHERE site_id=1 AND status='approved'
UNION ALL SELECT 'pending',              COUNT(*) FROM judges WHERE site_id=1 AND status='pending'
UNION ALL SELECT 'rejected',             COUNT(*) FROM judges WHERE site_id=1 AND status='rejected'
UNION ALL SELECT 'nominations',          COUNT(*) FROM nominations WHERE site_id=1
UNION ALL SELECT 'award_categories',     COUNT(*) FROM award_categories WHERE site_id=1
UNION ALL SELECT 'judge_categories',     COUNT(*) FROM judge_categories WHERE site_id=1
UNION ALL SELECT 'judge_applicants',     COUNT(*) FROM judge_applicants
UNION ALL SELECT 'judge_scores',         COUNT(*) FROM judge_scores
UNION ALL SELECT 'shortlisted',          COUNT(*) FROM nominations WHERE site_id=1 AND is_shortlisted=true
UNION ALL SELECT 'finalists',            COUNT(*) FROM nominations WHERE site_id=1 AND is_finalist=true;
