export interface IReview {
  fileName: string;
  line: number;
  severity: severityType;
  category: categoryType;
  title: string;
  comment: string;
}

type severityType = 'critical' | 'major' | 'minor' | 'suggestion';

type categoryType =
  'logic' | 'security' | 'performance' | 'readability' | 'testing';
