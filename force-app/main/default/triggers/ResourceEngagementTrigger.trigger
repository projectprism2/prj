trigger ResourceEngagementTrigger on Resource_Engagement__c (before insert, after insert, before update, after update, before delete, after undelete){
    
    if(trigger.isBefore && (trigger.isInsert || trigger.isUpdate)){
        Set<Id> engagedTeamIdSet = new Set<Id>();
        Set<Id> teamIdSet = new Set<Id>();
        Set<Id> projectVersionIdSet = new Set<Id>();
        Set<String> teamVersionIdSet = new Set<String>();
        Map<String,Engaged_Team__c> newEngagedTeamMap = new Map<String,Engaged_Team__c>();
        List<Resource_Engagement__c> reListWithoutTeam = new List<Resource_Engagement__c>();
        List<Resource_Engagement__c> reListWithoutEngagedTeam = new List<Resource_Engagement__c>();
        for(Resource_Engagement__c re: Trigger.new){
            if(re.Engaged_Team__c != NULL){
                engagedTeamIdSet.add(re.Engaged_Team__c);
                reListWithoutTeam.add(re);
            }
            else if(re.Engaged_Team__c==NULL && re.Team__c!=NULL){
                teamIdSet.add(re.Team__c);
                projectVersionIdSet.add(re.Project_Version__c);
                reListWithoutEngagedTeam.add(re);
                Engaged_Team__c et = new Engaged_Team__c(Project_Version__c = re.Project_Version__c , Team__c= re.Team__c);
                newEngagedTeamMap.put(re.Team__c+'-'+re.Project_Version__c,et);
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
        if(!teamIdSet.isEmpty()){
            Map<String,Engaged_Team__c> engagedTeamMap = new Map<String,Engaged_Team__c>();
            for(Engaged_Team__c et : [SELECT Id, Team__c, Project_Version__c FROM Engaged_Team__c WHERE Team__c IN: teamIdSet AND Project_Version__c IN: projectVersionIdSet]){
                String teamVersionId = et.Team__c+'-'+et.Project_Version__c;
                if(newEngagedTeamMap.containsKey(teamVersionId)){
                    engagedTeamMap.put(teamVersionId,et);
                    newEngagedTeamMap.remove(teamVersionId);
                }
            }
            if(!newEngagedTeamMap.isEmpty()){
                insert newEngagedTeamMap.values();
            }
            engagedTeamMap.putAll(newEngagedTeamMap);
            for(Resource_Engagement__c resourceEngagement: reListWithoutEngagedTeam){
                String teamVersionId = resourceEngagement.Team__c+'-'+resourceEngagement.Project_Version__c;
                resourceEngagement.Engaged_Team__c = engagedTeamMap.get(teamVersionId).Id;
            }
        }
        
    }
    else{
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
        for(Project_Version__c pv: [SELECT Id, Total_Labour_Engaged_Cost__c,
                                    (Select Id, Engagement_Cost__c From Resource_Engagements__r Where Id NOT IN: reDeletedIdSet)
                                    FROM Project_Version__c 
                                    WHERE Id IN: projectVersionIdSet
                                    LIMIT 10000])
        {
            pv.Total_Labour_Engaged_Cost__c = 0;
            for(Resource_Engagement__c re: pv.Resource_Engagements__r){
                pv.Total_Labour_Engaged_Cost__c += re.Engagement_Cost__c;
            }
            pvListToUpdate.add(pv);
        }
        
        try{
            update pvListToUpdate;
        }
        catch(Exception e){
            System.debug('Exception in Resource Engagement trigger: '+e.getMessage());
        }
    }    
}