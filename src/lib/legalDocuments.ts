import policyText from '../content/policy.txt?raw';
import userAgreementText from '../content/polzovatelskoe.txt?raw';
import serviceDescriptionText from '../content/opisanie.txt?raw';
import consentText from '../content/consent.txt?raw';

export const legalDocuments = {
  policy: policyText,
  userAgreement: userAgreementText,
  serviceDescription: serviceDescriptionText,
  consent: consentText,
};

export function formatLegalDocument(text: string): string[] {
  return text.split('\n').filter(line => line.trim() !== '');
}
