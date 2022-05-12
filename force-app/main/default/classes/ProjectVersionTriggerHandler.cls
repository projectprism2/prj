public class ProjectVersionTriggerHandler {

    /* this method is called from before insert Project Version trigger */
    public static void handleBeforeInsert(List<Project_Version__c> newVersions){
        Set<Id> clonedFromIdSet = new Set<Id>();
        List<Project_Version__c> projectVerionClones = new List<Project_Version__c>();
        for(Project_Version__c pv: newVersions){
            if(pv.isClone()){
                //inside isClone()
                pv.Cloned_From__c = pv.getCloneSourceId();
            }
            if(pv.Cloned_From__c != NULL){
                clonedFromIdSet.add(pv.Cloned_From__c);
                projectVerionClones.add(pv);
            }
        }
        if(!clonedFromIdSet.isEmpty()){
            handleCloningBeforeInsert(clonedFromIdSet, projectVerionClones);
        }
    }
    
    /* this method is called from handleBeforeInsert method, 
	in this method fields of Project Version are copied to the new Version */
    public static void handleCloningBeforeInsert(Set<Id> clonedFromIdSet, List<Project_Version__c> projectVerionClones){
        
    }
    
    
    /* this method is called from after insert Project Version trigger */
    public static void handleAfterInsert(List<Project_Version__c> newVersions){
        Set<Id> clonedFromIdSet = new Set<Id>();
        List<Project_Version__c> projectVerionClones = new List<Project_Version__c>();
        for(Project_Version__c pv: newVersions){
            if(pv.Cloned_From__c != NULL){
                clonedFromIdSet.add(pv.Cloned_From__c);
                projectVerionClones.add(pv);
            }
        }
        if(!clonedFromIdSet.isEmpty()){
            handleCloningAfterInsert(clonedFromIdSet, projectVerionClones);
        }
    }
    
    /* this method is called from handleAfterInsert method,
	in this method related object records are created on the new version*/
    public static void handleCloningAfterInsert(Set<Id> clonedFromIdSet, List<Project_Version__c> projectVerionClones){
        
    }
}