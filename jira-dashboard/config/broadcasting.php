    <?php

    return [

        /*
        |--------------------------------------------------------------------------
        | Default Broadcast Driver
        |--------------------------------------------------------------------------
        |
        | This option controls the default broadcast driver that will be used to
        | broadcast events. The "pusher" driver is available for use out of
        | the box. You may also use "redis" or "log" drivers as well.
        |
        */

        'default' => env('BROADCAST_DRIVER', 'pusher'),

        /*
        |--------------------------------------------------------------------------
        | Broadcast Connections
        |--------------------------------------------------------------------------
        |
        | Here you may define all of the broadcast connections that will be used
        | by your application. The "pusher" driver is the most common, but
        | other drivers like "redis" and "log" are available.
        |
        */
        'connections' => [

            'pusher' => [
                'driver' => 'pusher',
                'key' => env('5c6a84f9a4289a236860'),
                'secret' => env('b5397cb310441eafec12'),
                'app_id' => env('1943619'),
                'cluster' => env('eu'),
                'use_tls' => true,
            ],

            'redis' => [
                'driver' => 'redis',
                'connection' => 'default',
            ],

            'log' => [
                'driver' => 'log',
            ],

        ],

    ];
