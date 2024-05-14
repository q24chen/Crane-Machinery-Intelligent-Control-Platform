import {
	Clock,
	Color,
	Matrix4,
	Mesh,
	RepeatWrapping,
	ShaderMaterial,
	TextureLoader,
	UniformsLib,
	UniformsUtils,
	Vector2,
	Vector4
} from 'three';
import * as THREE from 'three';
import { Reflector } from './Reflector.js';
import { Refractor } from './Refractor.js';
/**
 * References:
 *	https://alex.vlachos.com/graphics/Vlachos-SIGGRAPH10-WaterFlow.pdf
 *	http://graphicsrunner.blogspot.de/2010/08/water-using-flow-maps.html
 *
 */

class Water extends Mesh {

	constructor( geometry, options = {} ) {

		super( geometry );

		this.type = 'Water';


		this.color = ( options.color !== undefined ) ? new Color( options.color ) : new Color( 0xFFFFFF );
		this.textureWidth = options.textureWidth || 512;
		this.textureHeight = options.textureHeight || 512;
		this.clipBias = options.clipBias || 0;
		this.flowDirection = options.flowDirection || new Vector2( 1, 0 );
		this.flowSpeed = options.flowSpeed || 0.03;
		this.reflectivity = options.reflectivity || 0.02;
		this._scale = options.scale || 1;
		this.shader = options.shader || Water.WaterShader;

		this.textureLoader = new TextureLoader();

		this.flowMap = options.flowMap || undefined;
		this.normalMap0 = options.normalMap0 || this.textureLoader.load( 'src/js/effect/water/Water_1_M_Normal.jpg' );
		this.normalMap1 = options.normalMap1 || this.textureLoader.load( 'src/js/effect/water/Water_2_M_Normal.jpg' );

        console.log(this.normalMap0);
		this.cycle = 0.15; // a cycle of a flow map phase
		this.halfCycle = this.cycle * 0.5;
		this.textureMatrix = new Matrix4();
		this.clock = new Clock();
		this._normal=options.normal||new THREE.Vector3(0,0,1);

		// internal components

		if ( Reflector === undefined ) {

			console.error( 'THREE.Water: Required component Reflector not found.' );
			return;

		}

		if ( Refractor === undefined ) {

			console.error( 'THREE.Water: Required component Refractor not found.' );
			return;

		}

		this.reflector = new Reflector( geometry, {
			textureWidth: this.textureWidth,
			textureHeight: this.textureHeight,
			clipBias: this.clipBias,
			normal:this._normal
		} );

		this.refractor = new Refractor( geometry, {
			textureWidth: this.textureWidth,
			textureHeight: this.textureHeight,
			clipBias: this.clipBias,
			normal:this._normal
		} );

		this.reflector.matrixAutoUpdate = false;
		this.refractor.matrixAutoUpdate = false;

		// material

		this.material = new ShaderMaterial( {
			uniforms: UniformsUtils.merge( [
				UniformsLib[ 'fog' ],
				this.shader.uniforms
			] ),
			vertexShader: this.shader.vertexShader,
			fragmentShader: this.shader.fragmentShader,
			transparent: true,
			fog: true,
           // side: THREE.DoubleSide,
		} );

		if ( this.flowMap !== undefined ) {

			this.material.defines.USE_FLOWMAP = '';
			this.material.uniforms[ 'tFlowMap' ] = {
				type: 't',
				value: this.flowMap
			};

		} else {

			this.material.uniforms[ 'flowDirection' ] = {
				type: 'v2',
				value: this.flowDirection
			};

		}

		// maps

		// this.normalMap0.wrapS = this.normalMap0.wrapT = THREE.ClampToEdgeWrapping;
		// this.normalMap1.wrapS = this.normalMap1.wrapT = THREE.ClampToEdgeWrapping;

		this.normalMap0.wrapS = this.normalMap0.wrapT = RepeatWrapping;
		this.normalMap1.wrapS = this.normalMap1.wrapT = RepeatWrapping;
		// this.normalMap0.repeat.set(100,100);
		// this.normalMap1.repeat.set(100,100);
		this.material.uniforms[ 'tReflectionMap' ].value = this.reflector.getRenderTarget().texture;
		this.material.uniforms[ 'tRefractionMap' ].value = this.refractor.getRenderTarget().texture;
		this.material.uniforms[ 'tNormalMap0' ].value = this.normalMap0;
		this.material.uniforms[ 'tNormalMap1' ].value = this.normalMap1;

		// water

		this.material.uniforms[ 'color' ].value = this.color;
		this.material.uniforms[ 'reflectivity' ].value = this.reflectivity;
		this.material.uniforms[ 'textureMatrix' ].value = this.textureMatrix;

		// inital values

		this.material.uniforms[ 'config' ].value.x = 0; // flowMapOffset0
		this.material.uniforms[ 'config' ].value.y = this.halfCycle; // flowMapOffset1
		this.material.uniforms[ 'config' ].value.z = this.halfCycle; // halfCycle
		this.material.uniforms[ 'config' ].value.w = this._scale; // scale
        this._material=this.material;
		// functions

		this.updateTextureMatrix=function( camera ) {

			this.textureMatrix.set(
				0.5, 0.0, 0.0, 0.5,
				0.0, 0.5, 0.0, 0.5,
				0.0, 0.0, 0.5, 0.5,
				0.0, 0.0, 0.0, 1.0
			);

			this.textureMatrix.multiply( camera.projectionMatrix );
			this.textureMatrix.multiply( camera.matrixWorldInverse );
			this.textureMatrix.multiply( this.matrixWorld );

		}

		this.updateFlow=function() {
            this.material=this._material;
			const delta = this.clock.getDelta();
			const config = this.material.uniforms[ 'config' ];

			config.value.x += this.flowSpeed * delta; // flowMapOffset0
			config.value.y = config.value.x + this.halfCycle; // flowMapOffset1

			// Important: The distance between offsets should be always the value of "halfCycle".
			// Moreover, both offsets should be in the range of [ 0, cycle ].
			// This approach ensures a smooth water flow and avoids "reset" effects.

			if ( config.value.x >= this.cycle ) {

				config.value.x = 0;
				config.value.y = this.halfCycle;

			} else if ( config.value.y >= this.cycle ) {

				config.value.y = config.value.y - this.cycle;

			}

		}

		//

		this.onBeforeRender = function ( renderer, scene, camera ) {
			this.updateTextureMatrix( camera );
			this.updateFlow();

			this.visible = false;

			this.reflector.matrixWorld.copy( this.matrixWorld );
			this.refractor.matrixWorld.copy( this.matrixWorld );

			this.reflector.onBeforeRender( renderer, scene, camera );
			this.refractor.onBeforeRender( renderer, scene, camera );

			this.visible = true;

		};

	}

}

Water.prototype.isWater = true;

Water.WaterShader = {

	uniforms: {

		'color': {
			type: 'c',
			value: null
		},

		'reflectivity': {
			type: 'f',
			value: 0
		},

		'tReflectionMap': {
			type: 't',
			value: null
		},

		'tRefractionMap': {
			type: 't',
			value: null
		},

		'tNormalMap0': {
			type: 't',
			value: null
		},

		'tNormalMap1': {
			type: 't',
			value: null
		},

		'textureMatrix': {
			type: 'm4',
			value: null
		},

		'config': {
			type: 'v4',
			value: new Vector4()
		}

	},

	vertexShader: /* glsl */`

		#include <common>
		#include <fog_pars_vertex>
		#include <logdepthbuf_pars_vertex>

		uniform mat4 textureMatrix;

		varying vec4 vCoord;
		varying vec2 vUv;
		varying vec3 vToEye;

		void main() {

			vUv = uv;
			vCoord = textureMatrix * vec4( position, 1.0 );

			vec4 worldPosition = modelMatrix * vec4( position, 1.0 );
			vToEye = cameraPosition - worldPosition.xyz;

			vec4 mvPosition =  viewMatrix * worldPosition; // used in fog_vertex
			gl_Position = projectionMatrix * mvPosition;

			#include <logdepthbuf_vertex>
			#include <fog_vertex>

		}`,

	fragmentShader: /* glsl */`

		#include <common>
		#include <fog_pars_fragment>
		#include <logdepthbuf_pars_fragment>

		uniform sampler2D tReflectionMap;
		uniform sampler2D tRefractionMap;
		uniform sampler2D tNormalMap0;
		uniform sampler2D tNormalMap1;

		#ifdef USE_FLOWMAP
			uniform sampler2D tFlowMap;
		#else
			uniform vec2 flowDirection;
		#endif

		uniform vec3 color;
		uniform float reflectivity;
		uniform vec4 config;

		varying vec4 vCoord;
		varying vec2 vUv;
		varying vec3 vToEye;

		void main() {

			#include <logdepthbuf_fragment>

			float flowMapOffset0 = config.x;
			float flowMapOffset1 = config.y;
			float halfCycle = config.z;
			float scale = config.w;

			vec3 toEye = normalize( vToEye );

			// determine flow direction
			vec2 flow;
			#ifdef USE_FLOWMAP
				flow = texture2D( tFlowMap, vUv ).rg * 2.0 - 1.0;
			#else
				flow = flowDirection;
			#endif
			flow.x *= - 1.0;

			// sample normal maps (distort uvs with flowdata)
			vec4 normalColor0 = texture2D( tNormalMap0, ( vUv * scale ) + flow * flowMapOffset0 );
			vec4 normalColor1 = texture2D( tNormalMap1, ( vUv * scale ) + flow * flowMapOffset1 );

			// linear interpolate to get the final normal color
			float flowLerp = abs( halfCycle - flowMapOffset0 ) / halfCycle;
			vec4 normalColor = mix( normalColor0, normalColor1, flowLerp );

			// calculate normal vector
			vec3 normal = normalize( vec3( normalColor.r * 2.0 - 1.0, normalColor.b,  normalColor.g * 2.0 - 1.0 ) );

			// calculate the fresnel term to blend reflection and refraction maps
			float theta = max( dot( toEye, normal ), 0.0 );
			float reflectance = reflectivity + ( 1.0 - reflectivity ) * pow( ( 1.0 - theta ), 5.0 );

			// calculate final uv coords
			vec3 coord = vCoord.xyz / vCoord.w;
			vec2 uv = coord.xy + coord.z * normal.xz * 0.05;

			vec4 reflectColor = texture2D( tReflectionMap, vec2( 1.0 - uv.x, uv.y ) );
			vec4 refractColor = texture2D( tRefractionMap, uv );

			// multiply water color with the mix of both textures
			gl_FragColor = vec4( color, 1.0 ) * mix( refractColor, reflectColor, reflectance )*2.0;
			//gl_FragColor = vec4( color, 1.0 ) *reflectColor*1.2;
            //gl_FragColor = vec4( 1.0,0.0,0.0, 1.0 ) ;
			//gl_FragColor=texture2D( tNormalMap0,vUv);
			#include <tonemapping_fragment>
			#include <encodings_fragment>
			#include <fog_fragment>

		}`
};

export { Water };
