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
        //Users can use Standard Clone button for time being
    }
    
    
    /* this method is called from after insert Project Version trigger */
    public static void handleAfterInsert(Map<Id,Project_Version__c> newVersionMap){
        
        
        Map<Id,List<Project_Version__c>> clonedFromIdToClonesMap = new Map<Id,List<Project_Version__c>>();
        Set<Id> nonCloneIdSet = new Set<Id>();
        for(Project_Version__c pv: newVersionMap.values()){
            if(pv.Cloned_From__c != NULL){
                List<Project_Version__c> clones = clonedFromIdToClonesMap.containsKey(pv.Cloned_From__c)? clonedFromIdToClonesMap.get(pv.Cloned_From__c) : new List<Project_Version__c>();
                clones.add(pv);
                clonedFromIdToClonesMap.put(pv.Cloned_From__c, clones);
            }
            else{
                nonCloneIdSet.add(pv.Id);
            }
        }
        if(!clonedFromIdToClonesMap.isEmpty()){
            handleCloningAfterInsert(clonedFromIdToClonesMap);
        }
        if(!nonCloneIdSet.isEmpty()){
            createFinacialsAfterInsert(nonCloneIdSet);
        }
    }
    
    /* this method is called from handleAfterInsert method,
	in this method related object records are created on the new version*/
    public static void handleCloningAfterInsert(Map<Id,List<Project_Version__c>> clonedFromIdToClonesMap){
        Map<Id,List<Engaged_Team__c>> clonedFromIdToEngagedTeamListMap = new Map<Id,List<Engaged_Team__c>>();
        Map<Id,List<Resource_Engagement__c>> clonedFromIdToResourceEngagementListMap = new Map<Id,List<Resource_Engagement__c>>();
        Map<Id,List<Material_Engagement__c>> clonedFromIdToMaterialEngagementListMap = new Map<Id,List<Material_Engagement__c>>();
        Map<Id,List<Forecast__c>> clonedFromIdToForecastListMap = new Map<Id,List<Forecast__c>>();
        Map<Id,List<Aggregator__c>> clonedFromIdToAggregatorListMap = new Map<Id,List<Aggregator__c>>();
        //Map<Id,Project_Version__c> clonedFromVersionMap = new Map<Id,Project_Version__c>([
        for(Project_Version__c clonedFromPV: [SELECT Id, Name, 
                                              (Select Id, Name, Team__c, Project_Version__c From Engaged_Teams__r),
                                              (Select Id, Name, Allocated_Color__c, Custom_Hourly_Rate__c, End_Date_of_Engagement__c, Engaged_Days__c, Engaged_Team__c, Engaged_Team__r.Team__c, Gantt_Filter__c, Hours_Engaged__c, Progress__c, Project_Version__c, Resource__c, Start_Date_of_Engagement__c, Status__c, Team__c, Number_of_Leaves__c, Number_of_Holidays__c From Resource_Engagements__r),
                                              (Select Id, Name, Material__c, Price__c, Project_Version__c, Quantity__c From Material_Engagements__r),
                                              (Select Id, Name, Year__c, Month__c, Material_Cost__c, Resource_Cost__c, Fixed_Cost__c, Total__c, Project_Version__c From Forecasts__r ORDER BY Year__c, Month__c), 
                                              (Select Id, Name, Year__c, Month__c, Material_Cost__c, Resource_Cost__c, Fixed_Cost__c, Total__c, Project_Version__c From Aggregator__r ORDER BY Year__c, Month__c) 
                                              FROM Project_Version__c
                                              WHERE Id IN: clonedFromIdToClonesMap.keySet()
                                             ])
        {
            List<Engaged_Team__c> engagedTeams = new List<Engaged_Team__c>();
            for(List<Engaged_Team__c> etList: clonedFromPV.Engaged_Teams__r){
                engagedTeams.addAll(etList);
            }
            clonedFromIdToEngagedTeamListMap.put(clonedFromPV.Id, engagedTeams);
            
            List<Resource_Engagement__c> resourceEngagements = new List<Resource_Engagement__c>();
            for(List<Resource_Engagement__c> reList: clonedFromPV.Resource_Engagements__r){
                resourceEngagements.addAll(reList);
            }
            clonedFromIdToResourceEngagementListMap.put(clonedFromPV.Id, resourceEngagements);
            
            List<Material_Engagement__c> materialEngagements = new List<Material_Engagement__c>();
            for(List<Material_Engagement__c> meList: clonedFromPV.Material_Engagements__r){
                materialEngagements.addAll(meList);
            }
            clonedFromIdToMaterialEngagementListMap.put(clonedFromPV.Id, materialEngagements);

            List<Forecast__c> fList = new List<Forecast__c>();
            for(List<Forecast__c> oldRecList: clonedFromPV.Forecasts__r){
                fList.addAll(oldRecList);
            }
            clonedFromIdToForecastListMap.put(clonedFromPV.Id,fList);

            List<Aggregator__c> aggList = new List<Aggregator__c>();
            for(List<Aggregator__c> oldRecList: clonedFromPV.Aggregator__r){
                aggList.addAll(oldRecList);
            }
            clonedFromIdToAggregatorListMap.put(clonedFromPV.Id,aggList);
        }
        
        
        Map<String,Engaged_Team__c> engagedTeamsToInsertMap = new Map<String,Engaged_Team__c>();
        List<Forecast__c> forecastInsertList = new List<Forecast__c>();
        List<Aggregator__c> aggregatorInsertList = new List<Aggregator__c>();
        for(Id clonedFromId: clonedFromIdToClonesMap.keySet()){
            List<Project_Version__c> pvClones = clonedFromIdToClonesMap.get(clonedFromId);
            for(Project_Version__c newPV: pvClones){
                if(clonedFromIdToEngagedTeamListMap.containsKey(clonedFromId)){
                    for(Engaged_Team__c etOld: clonedFromIdToEngagedTeamListMap.get(clonedFromId)){
                        Engaged_Team__c etNew = etOld.clone(false, true);
                        etNew.Project_Version__c = newPV.Id;
                        engagedTeamsToInsertMap.put(String.valueOf(clonedFromId)+String.valueOf(etOld.Team__c),etNew);
                    }
                }
                if(clonedFromIdToForecastListMap.containsKey(clonedFromId)){
                    for(Forecast__c fOld: clonedFromIdToForecastListMap.get(clonedFromId)){
                        Forecast__c fNew = fOld.clone(false, true);
                        fNew.Project_Version__c = newPV.Id;
                        forecastInsertList.add(fNew);
                    }
                }
                if(clonedFromIdToAggregatorListMap.containsKey(clonedFromId)){
                    for(Aggregator__c aggOld: clonedFromIdToAggregatorListMap.get(clonedFromId)){
                        Aggregator__c aggNew = aggOld.clone(false, true);
                        aggNew.Project_Version__c = newPV.Id;
                        aggregatorInsertList.add(aggNew);
                    }
                }
            }
        }
        
        

        if(!engagedTeamsToInsertMap.isEmpty()){
            insert engagedTeamsToInsertMap.values();
            
            List<Resource_Engagement__c> reListToInsert = new List<Resource_Engagement__c>();
            List<Material_Engagement__c> meListToInsert = new List<Material_Engagement__c>();
            for(Id clonedFromId: clonedFromIdToClonesMap.keySet()){
                List<Project_Version__c> pvClones = clonedFromIdToClonesMap.get(clonedFromId);
                for(Project_Version__c newPV: pvClones){
                    if(clonedFromIdToResourceEngagementListMap.containsKey(clonedFromId)){
                        for(Resource_Engagement__c reOld: clonedFromIdToResourceEngagementListMap.get(clonedFromId)){
                            Resource_Engagement__c reNew = reOld.clone(false, true);
                            reNew.Project_Version__c = newPV.Id;
                            reNew.Engaged_Team__c = engagedTeamsToInsertMap.get(String.valueOf(clonedFromId)+String.valueOf(reOld.Team__c)).Id;
                            reListToInsert.add(reNew);
                        }
                    }
                    if(clonedFromIdToMaterialEngagementListMap.containsKey(clonedFromId)){
                        for(Material_Engagement__c meOld: clonedFromIdToMaterialEngagementListMap.get(clonedFromId)){
                            Material_Engagement__c meNew = meOld.clone(false, true);
                            meNew.Project_Version__c = newPV.Id;
                            meListToInsert.add(meNew);
                        }
                    }
                }
            }
            
            insert reListToInsert;
            insert meListToInsert;
        }

        insert forecastInsertList;
        insert aggregatorInsertList;
    }

    public static void createFinacialsAfterInsert(Set<Id> freshProjectVersionIdSet){
        List<Project_Version__c> projectVersionList = [SELECT Id, Name, Start_Date__c, Release_Date__c, Proposed_Start__c, Targeted_Release__c, Project__c, Status__c FROM Project_Version__c WHERE Id IN: freshProjectVersionIdSet];
        List<Forecast__c> forecastList = new List<Forecast__c>();	
        List<Aggregator__c> aggregatorList = new List<Aggregator__c>();	
        for(Project_Version__c pv : projectVersionList){	
            Date startDate = (pv.Status__c == 'Draft' || pv.Start_Date__c == null) ? pv.Proposed_Start__c : pv.Start_Date__c;	
            Date endDate = (pv.Status__c == 'Draft' || pv.Release_Date__c == null) ? pv.Targeted_Release__c : pv.Release_Date__c;	
            Integer numberOfMonths = endDate!=NULL? (startDate.monthsBetween(endDate) >= 12 ? 12 : startDate.monthsBetween(endDate)+1) : 12;	
            system.System.debug('numberOfMonths--'+numberOfMonths);	
            Date forecastDate = startDate;	
            for(Integer i = 0 ; i < numberOfMonths; i++){	
                system.System.debug('forecastDate--'+forecastDate);	
                Forecast__c fc = new Forecast__c();	
                Aggregator__c agg = new Aggregator__c();
                agg.Project_Version__c = fc.Project_Version__c = pv.Id;	
                agg.Year__c = fc.Year__c = String.ValueOf(forecastDate.year());	
                agg.Month__c = fc.Month__c = String.ValueOf(forecastDate.month());	
                forecastList.add(fc);	
                aggregatorList.add(agg);	
                forecastDate = forecastDate.addMonths(1);	
            }	
        }	
        if(!forecastList.isEmpty()){	
            insert forecastList;
            insert aggregatorList;	
        }
    }
}