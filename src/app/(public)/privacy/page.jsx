import React from 'react';

const PrivacyPolicyPage = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Privacy Policy for Qlinic</h1>
      <p className="text-gray-600 mb-6">Last Updated: January 15, 2026</p>

      <div className="prose max-w-none">
        <p>At Qlinic, accessible from www.qlinichealth.com, one of our main priorities is the privacy of our visitors. This Privacy Policy document contains types of information that is collected and recorded by Qlinic and how we use it.</p>

        <h2 className="text-xl font-semibold mt-6 mb-3">General Data Protection Regulation (GDPR)</h2>
        <p>We are a Data Controller of your information.</p>
        <p>Qlinic legal basis for collecting and using the personal information described in this Privacy Policy depends on the Personal Information we collect and the specific context in which we collect it.</p>
        <p>Qlinic will collect and use your personal information only where we have a legal basis for doing so. Our legal basis includes:</p>
        <ul className="list-disc pl-6 mb-4">
          <li>To perform a contract with you</li>
          <li>To provide you with services</li>
          <li>To comply with the law</li>
          <li>To protect your vital interests</li>
          <li>To pursue our legitimate interests</li>
        </ul>

        <h2 className="text-xl font-semibold mt-6 mb-3">Information We Collect</h2>
        <p>We collect several different types of information for various purposes to provide and improve our service to you.</p>

        <h3 className="text-lg font-medium mt-4 mb-2">Personal Data</h3>
        <p>While using our service, we may ask you to provide us with certain personally identifiable information that can be used to contact or identify you ("Personal Data"). Personally identifiable information may include, but is not limited to:</p>
        <ul className="list-disc pl-6 mb-4">
          <li>Email address</li>
          <li>First name and last name</li>
          <li>Phone number</li>
          <li>Address, State, Province, ZIP/Postal code, City</li>
          <li>Cookies and Usage Data</li>
        </ul>

        <h3 className="text-lg font-medium mt-4 mb-2">Medical Data</h3>
        <p>As a healthcare platform, we may collect sensitive medical information including:</p>
        <ul className="list-disc pl-6 mb-4">
          <li>Medical history</li>
          <li>Current medications</li>
          <li>Allergies</li>
          <li>Diagnosis and treatment records</li>
          <li>Lab results</li>
          <li>Imaging results</li>
        </ul>

        <h2 className="text-xl font-semibold mt-6 mb-3">How We Use Your Information</h2>
        <p>We use the information we collect in various ways, including to:</p>
        <ul className="list-disc pl-6 mb-4">
          <li>Provide, operate, and maintain our service</li>
          <li>Improve, personalize, and expand our service</li>
          <li>Understand and analyze how you use our service</li>
          <li>Develop new products, services, features, and functionality</li>
          <li>Communicate with you, either directly or through one of our partners</li>
          <li>Send you emails</li>
          <li>Find and prevent fraud</li>
          <li>Provide customer support</li>
          <li>Contact you for updates or promotional materials</li>
        </ul>

        <h2 className="text-xl font-semibold mt-6 mb-3">Security of Data</h2>
        <p>The security of your data is important to us, but remember that no method of transmission over the Internet, or method of electronic storage is 100% secure. While we strive to use commercially acceptable means to protect your Personal Data, we cannot guarantee its absolute security.</p>

        <h2 className="text-xl font-semibold mt-6 mb-3">Service Providers</h2>
        <p>We may employ third-party companies and individuals due to the following reasons:</p>
        <ul className="list-disc pl-6 mb-4">
          <li>To facilitate our service</li>
          <li>To provide the service on our behalf</li>
          <li>To perform service-related services</li>
          <li>To assist us in analyzing how our service is used</li>
        </ul>

        <h2 className="text-xl font-semibold mt-6 mb-3">Children's Privacy</h2>
        <p>Our service does not address anyone under the age of 18 ("Children"). We do not knowingly collect personally identifiable information from anyone under the age of 18. If you are a parent or guardian and you are aware that your Children has provided us with Personal Data, please contact us. If we become aware that we have collected Personal Data from children without verification of parental consent, we take steps to remove that information from our servers.</p>

        <h2 className="text-xl font-semibold mt-6 mb-3">Changes to This Privacy Policy</h2>
        <p>We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page.</p>
        <p>You are advised to review this Privacy Policy periodically for any changes. Changes to this Privacy Policy are effective when they are posted on this page.</p>

        <h2 className="text-xl font-semibold mt-6 mb-3">Contact Us</h2>
        <p>If you have any questions about this Privacy Policy, please contact us:</p>
        <ul className="list-disc pl-6 mb-4">
          <li>By email: support@qlinichealth.com</li>
        </ul>
      </div>
    </div>
  );
};

export default PrivacyPolicyPage;