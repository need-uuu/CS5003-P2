(function(){
    // Handler for the register button
    function register() {
        let userId = document.getElementById("ID").value;
        let password = document.getElementById("Password").value;
        let data = { userId: userId, password: password };
        
        fetch(`/addUser`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        })
        .then(res => res.text())
        .then(txt => alert(txt));


        document.getElementById("registerButton").style.display = "none";
        alert("Register Success!");
    }

    document.addEventListener('DOMContentLoaded', function() {
        document.getElementById("save_button").addEventListener('click', register);
    
    });

})();


function showregister() {
    document.getElementById("register").style.display = "block";
    document.getElementById("letsregister").style.display = "block";
}




