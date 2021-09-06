let realmapp = null; 
let vueapp = null
let lastSeen = undefined

async function initRealm() 
{
    realmapp = new Realm.App({ id: "bledemo-pjitb" });
    const credentials = Realm.Credentials.anonymous();

    try {
    const user = await realmapp.logIn(credentials);
    } catch(err) {
    alert("Failed to log in", err);
    }
}

function initVue()
{
    let v = new Vue({
        el: '#app',
        data: {
          message: 'Hello Vue!'
        }
      })
    return v;
}

async function onLoad()
{
    vueapp =  initVue()
    await initRealm()
    if(realmapp.currentUser) { vueapp.message = realmapp.currentUser.id}
    await updateData()
    await updateData()
}

async function updateData()
{
   
    user = realmapp.currentUser;
    const result = await user.functions.getData(lastSeen);
    lastSeen = result.data[0] //Watch for empty
    console.log(result)

}