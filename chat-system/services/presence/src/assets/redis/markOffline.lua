-- KEYS[1] = user connections set (user:id:connections)
-- KEYS[2] = user online key (user:id:online)
-- ARGV[1] = socketId to remove
-- ARGV[2] = current heartbeat key (heartbeat:socketId)

-- 1. Remove the current socket and delete its heartbeat
redis.call("SREM", KEYS[1], ARGV[1])
redis.call("DEL", ARGV[2])

-- 2. Get all remaining sockets for this user
local remaining = redis.call("SMEMBERS", KEYS[1])
local is_still_online = false

-- 3. Check heartbeats of every connection of the user left. 
-- Clean up ghosts as we go!
for i, sid in ipairs(remaining) do
    if redis.call("EXISTS", ARGV[3] .. sid) == 1 then
        is_still_online = true 
    else
        redis.call("SREM", KEYS[1], sid)
    end
end

-- 4. If nobody is left with a heartbeat, the user is truly offline
if not is_still_online then 
    redis.call("DEL", KEYS[2])
end

return is_still_online -- Return status for the app (optional)