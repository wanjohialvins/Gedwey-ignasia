-- ====================================================
-- GEDWEY IGNASIA — DATABASE SEED
-- ====================================================

-- Seed default cards into the cards table
INSERT INTO public.cards (id, text, category, min_relationship_stage) VALUES
('f1f1f1f1-f1f1-f1f1-f1f1-f1f1f1f1f1f1', 'What was your very first impression of me, and how has it changed?', 'discovery', NULL),
('f2f2f2f2-f2f2-f2f2-f2f2-f2f2f2f2f2f2', 'What is your idea of a perfect weekend getaway together?', 'discovery', NULL),
('f3f3f3f3-f3f3-f3f3-f3f3-f3f3f3f3f3f3', 'What is one small thing I do that always makes you smile?', 'discovery', NULL),
('a4f15d74-2790-48cb-96cf-06f15904d9c7', 'If we had an entire day with no responsibilities and no budget, how would we spend it?', 'discovery', NULL),
('5bfd6205-d91d-4001-9a7e-4076ea2454a8', 'What is a dream or goal you have that you haven''t shared with many people?', 'discovery', NULL),
('ce83c076-2678-43d9-95e9-d9d150654cd9', 'What makes you feel most loved and appreciated in our relationship?', 'intimacy', NULL),
('1b8fb5e0-165b-43d0-9975-dcf4bf9146df', 'When do you feel closest or most connected to me?', 'intimacy', NULL),
('dfb6d43e-a107-4e31-897d-6060c2bc4a89', 'Is there a conversation or topic we have been avoiding that we should talk about?', 'intimacy', NULL),
('34a5d8f6-d716-4b2a-89be-c967db5cf873', 'If we could instantly learn any skill or hobby together, what would it be?', 'fun', NULL),
('70d10e54-5c91-4c6e-8d8a-6b8032efb6fb', 'What is the funniest memory we share so far?', 'fun', NULL),
('c8f9db56-2e87-43c2-bf76-78e7bbd512a8', 'If we were characters in a movie or book, who would we be and why?', 'fun', NULL),
('8b3e8e91-628d-4e92-ab0c-4bc783ea7472', 'How well do you think we handle conflicts, and what could we improve?', 'relationship_health', NULL),
('5d0e729a-241c-43f1-b924-d2e850b1bc67', 'What is one area of our relationship where you feel we are thriving?', 'relationship_health', NULL),
('1e9db5f0-621c-44bf-80a5-e0d16cf29dbe', 'How can I support you better during stressful or busy weeks?', 'relationship_health', NULL)
ON CONFLICT (id) DO UPDATE SET 
  text = EXCLUDED.text,
  category = EXCLUDED.category;
