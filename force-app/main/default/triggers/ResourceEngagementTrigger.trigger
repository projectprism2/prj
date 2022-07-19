trigger ResourceEngagementTrigger on Resource_Engagement__c (before insert, after insert, before update, after update, before delete, after undelete){
    
    if(trigger.isBefore && (trigger.isInsert || trigger.isUpdate)){
        Set<Id> engagedTeamIdSet = new Set<Id>();
        Set<Id> contactIdSet = new Set<Id>();
        List<Resource_Engagement__c> reListWithoutTeam = new List<Resource_Engagement__c>();
        List<Resource_Engagement__c> reListWithoutDefaultHourlyRate = new List<Resource_Engagement__c>();
        for(Resource_Engagement__c re: Trigger.new){
            if(re.Engaged_Team__c != NULL){
                engagedTeamIdSet.add(re.Engaged_Team__c);
                reListWithoutTeam.add(re);
            }
            if(re.Default_Hourly_Rate__c == NULL){
                contactIdSet.add(re.Resource__c);
                reListWithoutDefaultHourlyRate.add(re);
            }
        }
        if(!engagedTeamIdSet.isEmpty()){
            Map<Id,Engaged_Team__c> engagedTeamMap = new Map<Id,Engaged_Team__c>([SELECT Id, Team__c FROM Engaged_Team__c WHERE Id IN: engagedTeamIdSet]);
            for(Resource_Engagement__c reWithoutTeam: reListWithoutTeam){
                if(engagedTeamMap.containsKey(reWithoutTeam.Engaged_Team__c)){
                    reWithoutTeam.Team__c = engagedTeamMap.get(reWithoutTeam.Engaged_Team__c).Team__c;
                }                
            }
        }
        if(!contactIdSet.isEmpty()){
            Map<Id,Contact> contactMap = new Map<Id,Contact>([SELECT Id, Resource_Hourly_Rate__c FROM Contact WHERE Id IN: contactIdSet AND Resource_Hourly_Rate__c != NULL]);
			for(Resource_Engagement__c reWithoutRate: reListWithoutDefaultHourlyRate){
                if(contactMap.containsKey(reWithoutRate.Resource__c)){
                    reWithoutRate.Default_Hourly_Rate__c = contactMap.get(reWithoutRate.Resource__c).Resource_Hourly_Rate__c;
                }                
            }
            
        }
        
    }
    else{
        // Converting the follwing into a rollup summary field 
        /*
        Set<Id> projectVersionIdSet = new Set<Id>();
        Set<Id> reDeletedIdSet = new Set<Id>();
        for(Resource_Engagement__c re: (Trigger.isDelete ? Trigger.old : Trigger.new)){
            if(re.Project_Version__c != null){
                projectVersionIdSet.add(re.Project_Version__c);
            }
            if(Trigger.isDelete){
                reDeletedIdSet.add(re.Id);
            }
        }
        
        List<Project_Version__c> pvListToUpdate = new List<Project_Version__c>();   
        for(Project_Version__c pv: [SELECT Id, Total_Resource_Cost__c,
                                    (Select Id, Engagement_Cost__c From Resource_Engagements__r Where Id NOT IN: reDeletedIdSet)
                                    FROM Project_Version__c 
                                    WHERE Id IN: projectVersionIdSet
                                    LIMIT 10000])
        {
            pv.Total_Resource_Cost__c = 0;
            for(Resource_Engagement__c re: pv.Resource_Engagements__r){
                pv.Total_Resource_Cost__c += re.Engagement_Cost__c;
            }
            pvListToUpdate.add(pv);
        }
        
        try{
            update pvListToUpdate;
        }
        catch(Exception e){
            System.debug('Exception in Resource Engagement trigger: '+e.getMessage());
        }
        */
    }    
}