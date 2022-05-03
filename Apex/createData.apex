Business_Case__c bcCompleted = new Business_Case__c();
bcCompleted.Name = 'Technology Upgrade to Current DB';
bcCompleted.Status__c = 'Completed';
insert bcCompleted;

Account acc = new Account();
acc.Name = 'Arandle Pty Ltd';
insert acc;

Contact clientcnt = new Contact();
clientcnt.AccountId = acc.id;
clientcnt.FirstName = 'Rob';
clientcnt.LastName = 'Hawke';
clientcnt.Email = 'Rob.Hwake@yopmail.com';
insert clientcnt;

Contact primaryContact = new Contact();
primaryContact.FirstName = 'Shiela';
primaryContact.LastName = 'Internal';
primaryContact.Email = 'Shiela.internal@yopmail.com';
insert primaryContact;

Project__c prj = new Project__c();
prj.Project_Name__c = 'Phase 1 : TUC DB';
prj.Proposed_start__c = system.today() + 20;
prj.Business_Case__c = bcCompleted.id;
prj.Approvers__c = UserInfo.getUserId();
prj.Executive_Sponsor__c = primaryContact.id;
prj.Return_on_Investment__c = 4002;
prj.Risk_assessment__c = 'Medium';
prj.Category__c = 'Software Upgrade';
prj.Start_Date__c  = System.today();
insert prj;