trigger MaterialEngagementTrigger on Material_Engagement__c (after insert, after update, before delete, after undelete) {
	Set<Id> projectVersionIdSet = new Set<Id>();
    Set<Id> meDeletedIdSet = new Set<Id>();
    for(Material_Engagement__c me: (Trigger.isDelete ? Trigger.old : Trigger.new)){
        if(me.Project_Version__c != null){
            projectVersionIdSet.add(me.Project_Version__c);
        }
        if(Trigger.isDelete){
            meDeletedIdSet.add(me.Id);
        }
    }

	List<Project_Version__c> pvListToUpdate = new List<Project_Version__c>();   
    for(Project_Version__c pv: [SELECT Id, Total_Material_Engaged_Cost__c,
                                (Select Id, Amount__c From Material_Engagements__r Where Id NOT IN: meDeletedIdSet)
                                FROM Project_Version__c 
                                WHERE Id IN: projectVersionIdSet
                                LIMIT 10000])
    {
        pv.Total_Material_Engaged_Cost__c = 0;
        for(Material_Engagement__c me: pv.Material_Engagements__r){
            pv.Total_Material_Engaged_Cost__c += me.Amount__c;
        }
        pvListToUpdate.add(pv);
    }
    
    try{
        update pvListToUpdate;
    }
    catch(Exception e){
        System.debug('Exception in Material Engagement trigger: '+e.getMessage());
    }
}