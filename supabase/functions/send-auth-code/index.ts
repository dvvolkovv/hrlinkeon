import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { phone } = await req.json();

    if (!phone) {
      return new Response(
        JSON.stringify({ error: 'Номер телефона обязателен' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const code = generateCode();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

    let recruiterId = null;
    const { data: existingRecruiter } = await supabase
      .from('recruiters')
      .select('id')
      .eq('phone', phone)
      .maybeSingle();

    if (existingRecruiter) {
      recruiterId = existingRecruiter.id;
    } else {
      const { data: newRecruiter, error: createError } = await supabase
        .from('recruiters')
        .insert({ phone })
        .select('id')
        .single();

      if (createError) {
        console.error('Error creating recruiter:', createError);
        return new Response(
          JSON.stringify({ error: 'Ошибка создания пользователя' }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      recruiterId = newRecruiter.id;

      await supabase
        .from('token_balances')
        .insert({
          recruiter_id: recruiterId,
          balance: 0,
          total_purchased: 0,
          total_consumed: 0,
        });
    }

    const { error: insertError } = await supabase
      .from('auth_codes')
      .insert({
        recruiter_id: recruiterId,
        phone,
        code,
        expires_at: expiresAt,
        verified: false,
      });

    if (insertError) {
      console.error('Error inserting auth code:', insertError);
      return new Response(
        JSON.stringify({ error: 'Ошибка сохранения кода' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log(`[DEV] SMS Code for ${phone}: ${code}`);

    return new Response(
      JSON.stringify({ success: true, message: 'Код отправлен' }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: 'Внутренняя ошибка сервера' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
