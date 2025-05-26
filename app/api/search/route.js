// app/api/search/route.js - FIXED VERSION
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/route';
import { prisma } from '../../../lib/prisma';
import { getCachedResult, setCachedResult, generateCacheKey } from '../../../lib/cache';

export const dynamic = 'force-dynamic';

export async function POST(req) {
  try {
    // Get session to verify user
    let session;
    let userId = null;
    
    try {
      session = await getServerSession(authOptions);
      userId = session?.user?.id;
      console.log("Session check completed", session ? "User authenticated" : "No session");
      
      if (!userId) {
        return NextResponse.json({
          error: 'You must be logged in to search'
        }, { status: 401 });
      }
    } catch (sessionError) {
      console.error("Session error:", sessionError);
      return NextResponse.json({
        error: 'Authentication error'
      }, { status: 401 });
    }
    
    // Check subscription status and search limits
    let isPremium = false;
    let searchesRemaining = 0;
    
    try {
      const users = await prisma.$queryRaw`
        SELECT u.id, s.plan, s.status, s."searchCount"
        FROM "User" u
        LEFT JOIN "Subscription" s ON u.id = s."userId"
        WHERE u.id = ${userId}
        LIMIT 1
      `;
      
      const user = users.length > 0 ? users[0] : null;
      
      if (!user?.plan) {
        await prisma.subscription.create({
          data: {
            userId,
            plan: 'free',
            status: 'inactive',
            searchCount: 0
          }
        });
        searchesRemaining = 5;
      } else {
        isPremium = user.plan === 'premium' && user.status === 'active';
        
        if (!isPremium) {
          const searchCount = user.searchCount || 0;
          const FREE_TIER_LIMIT = 5;
          
          searchesRemaining = Math.max(0, FREE_TIER_LIMIT - searchCount);
          
          if (searchesRemaining <= 0) {
            console.log("User reached search limit");
            return NextResponse.json({
              error: 'You have reached your monthly search limit. Please upgrade to continue searching.',
              requiresUpgrade: true
            }, { status: 403 });
          }
          
          await prisma.$executeRaw`
            UPDATE "Subscription" 
            SET "searchCount" = "searchCount" + 1
            WHERE "userId" = ${userId}
          `;
          console.log(`Updated search count for user ${userId}`);
          searchesRemaining--;
        }
      }
    } catch (error) {
      console.error('Error checking subscription:', error);
    }
    
    // Get search parameters from request body
    let searchData;
    try {
      const rawBody = await req.text();
      searchData = JSON.parse(rawBody);
    } catch (parseError) {
      console.error("Error parsing request body:", parseError);
      return NextResponse.json({ 
        error: 'Invalid request format' 
      }, { status: 400 });
    }
    
    // Build URL search params with PROPER parameter handling
    const searchParams = new URLSearchParams();
    
    // Required parameters
    if (!searchData.query) {
      return NextResponse.json({ 
        error: 'Search query is required' 
      }, { status: 400 });
    }
    searchParams.append('query', searchData.query);
    
    // CRITICAL FIX: Properly handle channelID parameter
    if (searchData.channelID && searchData.channelID.trim()) {
      console.log('Adding channelID to search:', searchData.channelID);
      searchParams.append('channelID', searchData.channelID.trim());
    }
    
    // Add other optional parameters with validation
    if (searchData.lang) searchParams.append('lang', searchData.lang);
    if (searchData.category) searchParams.append('category', searchData.category);
    if (searchData.excludeCategory) searchParams.append('excludeCategory', searchData.excludeCategory);
    if (searchData.minViews && !isNaN(searchData.minViews)) searchParams.append('minViews', searchData.minViews);
    if (searchData.maxViews && !isNaN(searchData.maxViews)) searchParams.append('maxViews', searchData.maxViews);
    if (searchData.startDate) searchParams.append('startDate', searchData.startDate);
    if (searchData.endDate) searchParams.append('endDate', searchData.endDate);
    if (searchData.sortField) searchParams.append('sortField', searchData.sortField);
    if (searchData.sortOrder) searchParams.append('sortOrder', searchData.sortOrder);
    
    // IMPORTANT: Follow Filmot creator's advice - use searchManualSubs=0 for efficiency
    searchParams.append('searchManualSubs', '0');
    
    // Generate cache key for this search
    const searchParamsObj = Object.fromEntries(searchParams.entries());
    const cacheKey = generateCacheKey(searchParamsObj);
    
    // Check cache first (as recommended by Filmot creator)
    const cachedResult = await getCachedResult(cacheKey);
    if (cachedResult) {
      console.log('Returning cached result for search');
      
      // Apply free tier limitations to cached results
      if (!isPremium && cachedResult.result && Array.isArray(cachedResult.result) && cachedResult.result.length > 2) {
        cachedResult.result = cachedResult.result.slice(0, 2);
        cachedResult.totalresultcount = cachedResult.result.length;
        cachedResult.freeAccountLimited = true;
      }
      
      cachedResult.isPremium = isPremium;
      cachedResult.searchesRemaining = isPremium ? null : searchesRemaining;
      
      return NextResponse.json(cachedResult);
    }
    
    // Use the server's API key from environment variables
    const apiKey = process.env.RAPIDAPI_KEY;
    
    if (!apiKey) {
      return NextResponse.json({ 
        error: 'Server API key is not configured' 
      }, { status: 500 });
    }
    
    // Set up options for the Filmot API request
    const options = {
      method: 'GET',
      headers: {
        'x-rapidapi-key': apiKey,
        'x-rapidapi-host': 'filmot-tube-metadata-archive.p.rapidapi.com'
      }
    };
    
    // CORRECT ENDPOINT: Use getsubtitlesearch (not getsearchsubtitles)
    const apiUrl = `https://filmot-tube-metadata-archive.p.rapidapi.com/getsubtitlesearch?${searchParams.toString()}`;
    
    console.log(`Making API request to: ${apiUrl}`);
    console.log('Search parameters:', Object.fromEntries(searchParams.entries()));
    
    const response = await fetch(apiUrl, options);
    
    console.log('API request status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`API request failed: ${response.status} - ${errorText}`);
      return NextResponse.json(
        { error: `API request failed: ${response.status} - ${errorText}` }, 
        { status: response.status }
      );
    }
    
    // Get the raw response text for better error handling
    const rawText = await response.text();
    
    console.log('Raw API response (first 300 chars):', rawText.substring(0, 300));
    
    if (!rawText.trim()) {
      throw new Error('Empty response received from API');
    }
    
    // Parse the API response
    let data;
    try {
      data = JSON.parse(rawText);
    } catch (parseError) {
      console.error('Error parsing API response:', parseError);
      console.error('Raw response:', rawText.substring(0, 500) + '...');
      throw new Error(`Failed to parse API response: ${parseError.message}`);
    }
    
    console.log('API response structure:', {
      hasResult: !!data.result,
      resultLength: data.result?.length || 0,
      totalResults: data.totalresultcount,
      hasError: !!data.error
    });
    
    // Handle API errors
    if (data.error) {
      console.error('Filmot API error:', data.error);
      return NextResponse.json({
        error: `Search failed: ${data.error}`
      }, { status: 400 });
    }
    
    // Apply free tier limitations - restrict to 2 results if not premium
    if (!isPremium && data && data.result && Array.isArray(data.result) && data.result.length > 2) {
      data.result = data.result.slice(0, 2);
      data.totalresultcount = data.result.length;
      data.freeAccountLimited = true;
      data.searchesRemaining = searchesRemaining;
    }
    
    // Add premium status and searches remaining to response
    data.isPremium = isPremium;
    data.searchesRemaining = isPremium ? null : searchesRemaining;
    
    // Cache the result for future requests (1 hour expiry)
    await setCachedResult(cacheKey, data, 3600);
    
    return NextResponse.json(data);
    
  } catch (error) {
    console.error('Search API error:', error);
    return NextResponse.json(
      { error: `Server error: ${error.message}` }, 
      { status: 500 }
    );
  }
}
