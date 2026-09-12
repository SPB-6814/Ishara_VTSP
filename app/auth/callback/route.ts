import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  // TODO: Handle Supabase auth callback
  const url = new URL(request.url)
  return NextResponse.redirect(url.origin + '/login')
}
