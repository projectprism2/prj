public with sharing class GanttDataForTasks {
    public GanttDataForTasks() {

    }

    @RemoteAction
    @AuraEnabled()
    public static Map<String, Object> getAllTasksAndMilestonesByProject(String currentRecordId) {
        List<GanttDataWrapper> ganttDataWrapperList = new List<GanttDataWrapper>();
        if(String.isNotBlank(currentRecordId)){
            Id recId = Id.valueOf(currentRecordId);
            String objName = recId.getSObjectType().getDescribe().getName();
            List<Task_Milestone__c> tasksAndMilestones = new List<Task_Milestone__c>();
            if(objName.equalsIgnoreCase('Project__c')){
                tasksAndMilestones = [SELECT Id, Name, Status__c, Progress__c, Task_Milestone_Subject__c, Start_Date__c, Due_Date__c, Parent__c, Is_Milestone__c, Project__c, Program__c 
                                        FROM Task_Milestone__c 
                                        WHERE Project__c =:  currentRecordId
                                        ORDER BY Start_Date__c];
            }
            else if(objName.equalsIgnoreCase('Program__c')){
                tasksAndMilestones = [SELECT Id, Name, Status__c, Progress__c, Task_Milestone_Subject__c, Start_Date__c, Due_Date__c, Parent__c, Is_Milestone__c, Project__c, Program__c 
                                        FROM Task_Milestone__c 
                                        WHERE Program__c =:  currentRecordId
                                        ORDER BY Start_Date__c];
            }

            for(Task_Milestone__c tm: tasksAndMilestones){
                ganttDataWrapperList.add(new GanttDataWrapper((tm.Is_Milestone__c? 'milestone':'task'), tm.Id, tm.Task_Milestone_Subject__c, Date.valueOf(tm.Start_Date__c), Date.valueOf(tm.Due_Date__c), tm.Parent__c, (tm.Progress__c != null? (tm.Progress__c/100) : 0) ));
            }
        }
        Map<String, Object> result = new Map<String, Object>{'tasks' => ganttDataWrapperList, 'links' => new List<String>() };
        return result;
    }
}
