import Card from "../common/Card";

export default function StatsCards() {
  return (
    <div className="grid grid-cols-4 gap-4 mb-6">
      <Card>
        <p className="text-sm text-gray-500">Tiến độ hôm nay</p>
        <h2 className="text-3xl font-bold mt-1">80%</h2>

        <div className="w-full bg-gray-200 h-2 rounded mt-3 overflow-hidden">
          <div className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 w-[80%] transition-all duration-500"></div>
        </div>
      </Card>

      <Card>
        <p className="text-sm text-gray-500">Từ mới</p>
        <h2 className="text-4xl font-bold mt-1">20</h2>
      </Card>

      <Card>
        <p className="text-sm text-gray-500">Ôn tập</p>
        <h2 className="text-4xl font-bold mt-1">15</h2>
      </Card>

      <Card>
        <p className="text-sm text-gray-500">Streak</p>
        <h2 className="text-4xl font-bold mt-1">12🔥</h2>
      </Card>
    </div>
  );
}
