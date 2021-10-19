var container, camera, scene, renderer;

function init3d()
{
    container = document.getElementById("test")
    console.log(container)
    renderer = new THREE.WebGLRenderer( { antialias: true } );
    console.log( container.offsetHeight)
    renderer.setSize( container.offsetWidth, container.offsetHeight );
    container.appendChild( renderer.domElement );
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera( 35, container.offsetWidth/ container.offsetHeight, 1, 10000 );
    camera.position.set( 3, 0.5, 3 );
    scene.add( camera ); // required, because we are adding a light as a child of the camera

    // lights

    //scene.background(0xffffff);
    scene.add( new THREE.AmbientLight( 0xffffff ) );
    var light = new THREE.PointLight( 0xffffff, 0.8 );
    camera.add( light );
    var loader = new THREE.STLLoader();
    console.log("Loadong STL")
    loader.load( 'images/leaf.stl', function ( geometry ) {
        var material = new THREE.MeshPhongMaterial( { color: 0x00684a} );
        var mesh = new THREE.Mesh( geometry, material );
        mesh.scale.set(0.02,0.02,0.02);
        scene.add( mesh );
        console.log("Added")
    } );
    window.addEventListener( 'resize', onWindowResize, false );
}


function onWindowResize() {
    console.log( container.offsetHeight)
    camera.aspect = container.offsetWidth/ container.offsetHeight;
    camera.updateProjectionMatrix();
    console.log("resize")
    renderer.setSize(container.offsetWidth,container.offsetHeight );
}


function animate3d() {
    requestAnimationFrame( animate3d );
    render();
}

function render() {
    var timer = Date.now() * 0.0005;
    camera.position.x = Math.cos( timer ) * 8;
    camera.position.z = Math.sin( timer ) * 8;
    camera.lookAt( scene.position );
    renderer.render( scene, camera );
}