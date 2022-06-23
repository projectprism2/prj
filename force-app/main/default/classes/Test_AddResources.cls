@isTest
public with sharing class Test_AddResources {
    @isTest 
    public static void TestAddResources() {
        Project__c prj = new Project__c(Project_Name__c='Test Project',Proposed_start__c=system.today());
        insert prj;
        Project_Version__c pv = new Project_Version__c(Name='Version 1',Project__c=prj.Id,Proposed_Start__c=system.today());
        insert pv;
        List<Contact> conList = new List<Contact>();
        Contact con1 = new Contact(FirstName='Test',LastName='Contact1');
        conList.add(con1);
        Contact con2 = new Contact(FirstName='Test',LastName='Contact2');
        conList.add(con2);
        insert conList;
        List<Team__c> teams = new List<Team__c>();
        Team__c team1 = new Team__c(Name='Test Team1');
        teams.add(team1);
        Team__c team2 = new Team__c(Name='Test Team2');
        teams.add(team2);
        insert teams;
        Engaged_Team__c et = new Engaged_Team__c(Team__c=team2.Id,Project_Version__c=pv.Id);
        insert et;
        List<Resource_Engagement__c> reList = new List<Resource_Engagement__c>();
        Resource_Engagement__c re1 = new Resource_Engagement__c(Project_Version__c=pv.Id, Resource__c=con1.Id,Team__c=team1.Id);
        reList.add(re1);
        Resource_Engagement__c re2 = new Resource_Engagement__c(Project_Version__c=pv.Id, Resource__c=con2.Id,Team__c=team2.Id,Engaged_Team__c=et.Id);
        reList.add(re2);
        insert reList;
        AddResources.fetchResources(pv.Id);
    }
}
