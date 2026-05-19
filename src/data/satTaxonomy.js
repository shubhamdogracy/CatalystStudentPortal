export const SAT_TAXONOMY = {
  math: {
    'Advanced Math': [
      'Equivalent expressions',
      'Nonlinear equations in one variable and systems of equations in two variables',
      'Nonlinear functions',
    ],
    'Algebra': [
      'Linear equations in one variable',
      'Linear equations in two variables',
      'Linear functions',
      'Linear inequalities in one or two variables',
      'Systems of two linear equations in two variables',
    ],
    'Geometry and Trigonometry': [
      'Area and volume',
      'Circles',
      'Lines, angles, and triangles',
      'Right triangles and trigonometry',
    ],
    'Problem-Solving and Data Analysis': [
      'Evaluating statistical claims: Observational studies and experiments',
      'Inference from sample statistics and margin of error',
      'One-variable data: Distributions and measures of center and spread',
      'Percentages',
      'Probability and conditional probability',
      'Ratios, rates, proportional relationships, and units',
      'Two-variable data: Models and scatterplots',
    ],
  },
  reading_writing: {
    'Craft and Structure': [
      'Cross-Text Connections',
      'Text Structure and Purpose',
      'Words in Context',
    ],
    'Expression of Ideas': [
      'Rhetorical Synthesis',
      'Transitions',
    ],
    'Information and Ideas': [
      'Central Ideas and Details',
      'Command of Evidence',
      'Inferences',
    ],
    'Standard English Conventions': [
      'Boundaries',
      'Form, Structure, and Sense',
    ],
  },
};

export function taxonomyTopics(subject) {
  if (subject === 'all') {
    return Object.values(SAT_TAXONOMY).flatMap(s => Object.keys(s));
  }
  return Object.keys(SAT_TAXONOMY[subject] || {});
}

export function taxonomySubtopics(subject, topic) {
  if (subject === 'all') {
    for (const s of Object.values(SAT_TAXONOMY)) {
      if (s[topic]) return s[topic];
    }
    return [];
  }
  return SAT_TAXONOMY[subject]?.[topic] || [];
}
