import type { Task } from '@/types'

// Verbatim from MEGA_PROMPT Module D3 — do not edit task text
export const TASK_DATA: Record<string, Task> = {
  A1: {
    id: 'seed-A1',
    task_code: 'A1',
    session_number: 1,
    display_order: 1,
    family: 'Data arithmetic',
    objective_question:
      'Prices: Bread 2,000 UGX, Milk 3,500 UGX, Sugar 4,000 UGX. A customer buys 3 bread, 2 milk, 1 sugar. What is the total cost?',
    justification_prompt:
      'Explain how you computed the total and how you checked the arithmetic.',
    answer_type: 'NUMERIC',
    correct_answer: '17000',
    answer_tolerance: null,
    parallel_to: null,
  },
  A2: {
    id: 'seed-A2',
    task_code: 'A2',
    session_number: 1,
    display_order: 2,
    family: 'Percent change',
    objective_question:
      'Weekly malaria cases: W1=30, W2=45, W3=40, W4=55. Percent increase from W1 to W4?',
    justification_prompt: 'Show the formula and steps. Include a quick check.',
    answer_type: 'NUMERIC',
    correct_answer: '83.3',
    answer_tolerance: 0.4,
    parallel_to: null,
  },
  B1: {
    id: 'seed-B1',
    task_code: 'B1',
    session_number: 1,
    display_order: 3,
    family: 'Logic validity',
    objective_question:
      'If it rains, the road floods. The road did not flood. Therefore it did not rain. Is this valid? Yes or No.',
    justification_prompt: 'Explain in 1 to 3 sentences using the rule given.',
    answer_type: 'YES_NO',
    correct_answer: 'YES',
    answer_tolerance: null,
    parallel_to: null,
  },
  B2: {
    id: 'seed-B2',
    task_code: 'B2',
    session_number: 1,
    display_order: 4,
    family: 'Time consistency',
    objective_question:
      'A timetable says a bus leaves at 08:00 and takes 1 hour 30 minutes. It arrived at 10:00. Is the timetable consistent? Yes or No.',
    justification_prompt: 'Explain your time calculation and what would be consistent.',
    answer_type: 'YES_NO',
    correct_answer: 'NO',
    answer_tolerance: null,
    parallel_to: null,
  },
  C1: {
    id: 'seed-C1',
    task_code: 'C1',
    session_number: 1,
    display_order: 5,
    family: 'Simple interest',
    objective_question:
      'Loan 1,000,000 UGX at 10% simple interest for 6 months. Interest amount?',
    justification_prompt: 'Write the formula and show one line of calculation.',
    answer_type: 'NUMERIC',
    correct_answer: '50000',
    answer_tolerance: null,
    parallel_to: null,
  },
  C2: {
    id: 'seed-C2',
    task_code: 'C2',
    session_number: 1,
    display_order: 6,
    family: 'Cost comparison',
    objective_question:
      'Plan is 5,000 UGX per day or 30,000 UGX per week. For 10 days, which is cheaper and by how much?',
    justification_prompt: 'Explain the comparison.',
    answer_type: 'TEXT',
    correct_answer: 'WEEKLY|5000',
    answer_tolerance: null,
    parallel_to: null,
  },
  A3: {
    id: 'seed-A3',
    task_code: 'A3',
    session_number: 2,
    display_order: 1,
    family: 'Data arithmetic (parallel)',
    objective_question:
      'Prices: Rice 4,500 UGX, Beans 3,000 UGX, Soap 2,500 UGX. Buy 2 rice, 1 beans, 3 soap. What is the total cost?',
    justification_prompt: 'Show how you checked the calculation.',
    answer_type: 'NUMERIC',
    correct_answer: '19500',
    answer_tolerance: null,
    parallel_to: 'A1',
  },
  A4: {
    id: 'seed-A4',
    task_code: 'A4',
    session_number: 2,
    display_order: 2,
    family: 'Average (parallel)',
    objective_question:
      'Water use in litres: Day 1 = 120, Day 2 = 150, Day 3 = 135, Day 4 = 165. What is the average daily use?',
    justification_prompt: 'Explain the steps for an average.',
    answer_type: 'NUMERIC',
    correct_answer: '142.5',
    answer_tolerance: 0.5,
    parallel_to: 'A2',
  },
  B3: {
    id: 'seed-B3',
    task_code: 'B3',
    session_number: 2,
    display_order: 3,
    family: 'Logic (parallel)',
    objective_question:
      'If a person is a student, then they have a registration number. John has no registration number. Can we conclude John is not a student? Yes or No.',
    justification_prompt: 'Explain your reasoning.',
    answer_type: 'YES_NO',
    correct_answer: 'YES',
    answer_tolerance: null,
    parallel_to: 'B1',
  },
  B4: {
    id: 'seed-B4',
    task_code: 'B4',
    session_number: 2,
    display_order: 4,
    family: 'Time (parallel)',
    objective_question:
      'A meeting starts at 14:10 and lasts 50 minutes. The minutes say it ended at 15:20. Is that correct? Yes or No.',
    justification_prompt: 'Explain the time calculation.',
    answer_type: 'YES_NO',
    correct_answer: 'NO',
    answer_tolerance: null,
    parallel_to: 'B2',
  },
}

export const SESSION1_ORDER = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const
export const SESSION2_ORDER = ['A3', 'A4', 'B3', 'B4'] as const
