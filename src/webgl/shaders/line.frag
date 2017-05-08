varying vec3 vCenter;

void main() {

	const uniform float epsilon = 0.01;

	if ( min( vCenter.x, vCenter.y)  < epsilon ||
	  max( vCenter.x, vCenter.y)  > 1.0 - epsilon )  {

		gl_FragColor = vec4( vec3( 1.0 ), 1.0 );
		gl_FragColor = vec4( vCenter, 1.0 );

		} else {

		gl_FragColor = vec4( vec3( 0.2 ), 1.0 );

		}

	}