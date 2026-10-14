<?php

namespace App\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;

class PublicRegistrationRoleValidator
{
    public function handle(Request $request, Closure $next)
    {
        // Check if this is a public registration request
        if ($request->route('is_public_registration')) {
            // Get the requested role from the body
            $role = $request->input('role');
            
            // Validate the role
            if (!in_array($role, ['client', 'freelancer'])) {
                return response()->json([
                    'error' => 'Invalid role for public registration'
                ], 400);
            }
        }
        
        return $next($request);
    }
}