import json, sys


def greet(name):
    return f"Hello, {name}!"


if __name__ == "__main__":
    # 从标准输入读取数据
    input_data = sys.stdin.read()
    data = json.loads(input_data)
    name = data.get("name", "World")

    # 返回 JSON 格式的响应
    result = {"message": greet(name)}
    print(json.dumps(result))
