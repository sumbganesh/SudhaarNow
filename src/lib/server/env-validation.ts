/**
 * Environment variable validation utility
 * Validates all required environment variables on server startup
 */

interface EnvVar {
	name: string;
	required: boolean;
	description: string;
	validate?: (value: string) => boolean;
}

const ENVIRONMENT_VARIABLES: EnvVar[] = [
	{
		name: 'TURSO_DATABASE_URL',
		required: true,
		description: 'Turso database connection URL (libsql://...)',
		validate: (value) => value.startsWith('libsql://')
	},
	{
		name: 'TURSO_AUTH_TOKEN',
		required: true,
		description: 'Turso database authentication token',
		validate: (value) => value.length > 0
	},
	{
		name: 'BLOB_READ_WRITE_TOKEN',
		required: true,
		description: 'Vercel Blob storage read/write token',
		validate: (value) => value.startsWith('vercel_blob_rw_')
	},
	{
		name: 'GOOGLE_MAPS_API_KEY',
		required: false,
		description: 'Google Maps API key for location features',
		validate: (value) => value.length > 0 && value !== 'your_google_maps_api_key_here'
	}
];

export interface ValidationResult {
	isValid: boolean;
	missing: string[];
	invalid: string[];
	optional: string[];
	errors: string[];
}

/**
 * Validates all environment variables
 * @returns ValidationResult with detailed information about missing/invalid variables
 */
export function validateEnvironment(): ValidationResult {
	const result: ValidationResult = {
		isValid: true,
		missing: [],
		invalid: [],
		optional: [],
		errors: []
	};

	for (const envVar of ENVIRONMENT_VARIABLES) {
		const value = process.env[envVar.name];
		
		if (!value) {
			if (envVar.required) {
				result.missing.push(envVar.name);
				result.errors.push(`Missing required environment variable: ${envVar.name} - ${envVar.description}`);
				result.isValid = false;
			} else {
				result.optional.push(envVar.name);
			}
		} else {
			// Check if it's a placeholder value
			if (value.includes('your_') || value.includes('_here')) {
				if (envVar.required) {
					result.invalid.push(envVar.name);
					result.errors.push(`Invalid environment variable: ${envVar.name} - Please replace placeholder value with actual credentials`);
					result.isValid = false;
				} else {
					result.optional.push(envVar.name);
				}
			} else if (envVar.validate && !envVar.validate(value)) {
				result.invalid.push(envVar.name);
				result.errors.push(`Invalid format for environment variable: ${envVar.name} - ${envVar.description}`);
				result.isValid = false;
			}
		}
	}

	return result;
}

/**
 * Validates environment variables and throws an error if validation fails
 * This should be called during server startup
 */
export function validateEnvironmentOrThrow(): void {
	const validation = validateEnvironment();
	
	if (!validation.isValid) {
		console.error('\n❌ Environment Validation Failed!\n');
		
		if (validation.missing.length > 0) {
			console.error('Missing required environment variables:');
			validation.missing.forEach(name => {
				const envVar = ENVIRONMENT_VARIABLES.find(e => e.name === name);
				console.error(`  • ${name}: ${envVar?.description}`);
			});
			console.error('');
		}
		
		if (validation.invalid.length > 0) {
			console.error('Invalid environment variables:');
			validation.invalid.forEach(name => {
				const envVar = ENVIRONMENT_VARIABLES.find(e => e.name === name);
				console.error(`  • ${name}: ${envVar?.description}`);
			});
			console.error('');
		}
		
		console.error('Please check your .env file and ensure all required variables are set correctly.');
		console.error('Refer to env.example for the required format.\n');
		
		throw new Error('Environment validation failed. See errors above.');
	}
	
	// Log optional missing variables as warnings
	if (validation.optional.length > 0) {
		console.warn('\n⚠️  Optional environment variables not set:');
		validation.optional.forEach(name => {
			const envVar = ENVIRONMENT_VARIABLES.find(e => e.name === name);
			console.warn(`  • ${name}: ${envVar?.description}`);
		});
		console.warn('');
	}
	
	console.log('✅ Environment validation passed!\n');
}

/**
 * Get a summary of environment variable status
 * Useful for debugging or status endpoints
 */
export function getEnvironmentStatus(): {
	status: 'valid' | 'invalid' | 'partial';
	summary: string;
	details: ValidationResult;
} {
	const validation = validateEnvironment();
	
	let status: 'valid' | 'invalid' | 'partial' = 'valid';
	let summary = 'All environment variables are properly configured';
	
	if (!validation.isValid) {
		status = 'invalid';
		summary = `${validation.missing.length} missing, ${validation.invalid.length} invalid environment variables`;
	} else if (validation.optional.length > 0) {
		status = 'partial';
		summary = `${validation.optional.length} optional environment variables not set`;
	}
	
	return {
		status,
		summary,
		details: validation
	};
}
