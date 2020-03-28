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
>## 1. *post* ```/api/create``` 
## takes :
* nameSpace(*int*) : the name space of your project.
## returns :
* message(*str*) : that confirms success.
>## 2. *post* ```/:nameSpace/room```
## takes :
* data(*json*) : a json string representing the data of the room you want to create.

    * you can add property ```defaultAccessLevel : accessLevel``` this is by default ```read-only```.
    * you can add property ```channel:boolean``` which means that only subscriberes can see the content.
    * you can add ```channel : {private : boolean } ``` so that no one can subscribe without invitation.
## returns :
* message(*str*) : that confirms success.
* room(*json*) : the created room.
>## 3. *post* ```/:nameSpace/join```
## takes : 
* socketId(*uuid*) :  the assigned ID for their socket connection.
## returns : 
* message(*str*) : that confirms success.
* rooms(*json*) : a list of rooms the user subscribed to.
>## 4. *post* ```/:nameSpace/invite```
## takes : 
* room(*int*) :  the ID for the room.
* invitedId(*int*) : the ID of the invited user.
* inviteAccessLevel(*accessLevel*) : the accessLevel given to the invited user .
## returns : 
* message(*str*) : that confirms success.
>## 5. *post* ```/:nameSpace/subscribe```
## takes : 
* room(*int*) :  the ID for the room.
## returns : 
* message(*str*) : that confirms success.
>## 6. *post* ```/:nameSpace/unsubscribe```
## takes : 
* room(*int*) :  the ID for the room.
## returns : 
* message(*str*) : that confirms success.
>## 7. *post* ```/:nameSpace/leave```
>## 8. *delete* ```/:nameSpace/remove```
## takes : 
* room(*int*) :  the ID for the room.
* removedId(*int*) : the ID of the removed user.
## returns : 
* message(*str*) : that confirms success.
>## 9. *get* ```/:nameSpace/subscribers```
## takes : 
* room(*int*) :  the ID for the room.
## returns : 
* message(*str*) : that confirms success.
* subscribers(*json*) : a list of the subsribers requested.
>## 10. *delete* ```/:nameSpace/room```
## takes : 
* room(*int*) :  the ID for the room.
## returns : 
* message(*str*) : that confirms success.
>## 11. *get* ```/:nameSpace/records```
## takes : 
* room(*int*) :  the ID for the room.
## returns : 
* message(*str*) : that confirms success.
* records(*json*) : a list of requested records.
>## 12. *get* ```/:nameSpace/records/unseen```
## returns : 
* message(*str*) : that confirms success.
* records(*json*) : a list of unseen records.
>## 13. *get* ```/:nameSpace/records/user```
## returns : 
* message(*str*) : that confirms success.
* records(*json*) : a list of authored records.
>## 14. *get* ```/:nameSpace/record```
## takes : 
* room(*int*) :  the ID for the room.
* recordId(*int*) : the ID of the record.
## returns : 
* message(*str*) : that confirms success.
* record(*json*) : the record requested.
>## 15. *put* ```/:nameSpace/record```
## takes : 
* room(*int*) :  the ID for the room.
* recordId(*int*) : the ID of the record.
* data(*json*) : the updated data.
## returns : 
* message(*str*) : that confirms success.
>## 16. *delete* ```/:nameSpace/record```
## takes : 
* room(*int*) :  the ID for the room.
* recordId(*int*) : the ID of the record.
## returns : 
* message(*str*) : that confirms success.
>## 17. *post* ```/:nameSpace/record```
## takes : 
* room(*int*) :  the ID for the room.
* data(*json*) : the record data.
## returns : 
* message(*str*) : that confirms success.
* record(*json*) : the record created.
>## 17. *post* ```/:nameSpace/record```
## takes : 
* room(*int*) :  the ID for the room.
* data(*json*) : the record data.
## returns : 
* message(*str*) : that confirms success.
* record(*json*) : the record created.

>## 18. *put* ```/:nameSpace/recordStatus```
## takes : 
* room(*int*) :  the ID for the room.
* recordId(*int*) : the ID of the record 
## returns : 
* message(*str*) : that confirms success.
>## 19. *post* ```/:nameSpace/user/signup```
## takes : 
* mail(*str*) :  the mail of the user.
* password(*str*) : the password of the user.
* userName(*str*) : the name of the user.
* data(*json*) : the data of the user.
## returns : 
* message(*str*) : that confirms success.
* user(*json*) : the user created.
>## 20. *post* ```/:nameSpace/user/signin```
## takes : 
* mail(*str*) :  the mail of the user.
* password(*str*) : the password of the user.
## returns : 
* message(*str*) : that confirms success.
* token(*jwt*) : the json web token.
* userId(*int*) : the ID of the user.
>## 1. *delete* ```/api/delete``` 
## takes :
* nameSpace(*int*) : the name space of your project.
## returns :
* message(*str*) : that confirms success.