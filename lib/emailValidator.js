// lib/emailValidator.js
const disposableEmailDomains = [
  '10minutemail.com',
  'guerrillamail.com',
  'mailinator.com',
  'tempmail.com',
  'throwaway.email',
  'temp-mail.org',
  'getairmail.com',
  'yopmail.com',
  'maildrop.cc',
  'sharklasers.com',
  'guerrillamailblock.com',
  'pokemail.net',
  'spam4.me',
  'bccto.me',
  'chacuo.net',
  'dispostable.com',
  'fakeinbox.com',
  'hide.biz.st',
  'mytrashmail.com',
  'nobulk.com',
  'sogetthis.com',
  'spambog.com',
  'spambog.de',
  'spambog.ru',
  'spamgourmet.com',
  'spamgourmet.net',
  'spamgourmet.org',
  'spamhole.com',
  'spammotel.com',
  'spaml.com',
  'spamthis.co.uk',
  'spamthisplease.com',
  'spamtrail.com',
  'spamtroll.net',
  'trashmail.org',
  'trashymail.com',
  'tyldd.com',
  'uggsrock.com',
  'wegwerfmail.de',
  'wegwerfmail.net',
  'wegwerfmail.org',
  'wh4f.org',
  'whyspam.me',
  'willselfdestruct.com',
  'xoxy.net',
  'yogamaven.com',
  'zoemail.org'
];

export function isDisposableEmail(email) {
  if (!email || typeof email !== 'string') {
    return false;
  }
  
  const domain = email.split('@')[1];
  if (!domain) {
    return false;
  }
  
  return disposableEmailDomains.includes(domain.toLowerCase());
}

export function validateEmailForSignup(email) {
  if (!email) {
    return { valid: false, message: 'Email is required' };
  }
  
  if (isDisposableEmail(email)) {
    return { 
      valid: false, 
      message: 'Temporary email addresses are not allowed. Please use a permanent email address.' 
    };
  }
  
  return { valid: true };
}
