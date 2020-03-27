# Events For The Client To Listen To :
1. recordCreated :
* gets : record.

2. recordUpdated : 
* gets : record.

3. recordDeleted : 
* gets : recordId.

4. seen :
* gets : {user,record}
> this is an object with the two properties of the reocord and the user

5. deliverd :
* gets : {user,record}
> this is an object with the two properties of the reocord and the user

6. online :
* gets : user.

7. offline : 
* gets : user.

8. subscribtion : 
* gets : user.

9. unsubscribtion :
* gets : user.

10. removed :
* gets : {user,remover}
> this is an object with the two properties of the removed user and the remover user


11. invited :
* gets : {user,inviter}
> this is an object with the two properties of the invited user and the inviter user

12. roomDeleted :
* gets : ```true```

# EndPoints To Hit :
1. 
